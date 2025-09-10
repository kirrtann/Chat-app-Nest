import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Chat } from './entities/chat.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';

interface UserInfo {
  userId: string;
  socketId: string;
}

interface RoomData {
  receiverId: string;
  senderId: string;
}

@WebSocketGateway(3002, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  host: '0.0.0.0',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
  ) {}

  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<UserInfo>> = new Map();
  private userSocketMap: Map<string, UserInfo> = new Map();
  private roomMetadata: Map<string, RoomData> = new Map();

  handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;

      if (!userId) {
        client.emit('error', { message: 'User ID required' });
        client.disconnect();
        return;
      }

      const userInfo: UserInfo = {
        userId,
        socketId: client.id,
      };

      this.userSocketMap.set(client.id, userInfo);

      client.emit('connected', {
        message: 'Successfully connected',
        socketId: client.id,
        userId,
      });
    } catch (error) {
      console.error('Connection error:', error);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const userInfo = this.userSocketMap.get(client.id);
      this.userSocketMap.delete(client.id);
      this.rooms.forEach((users, room) => {
        const userToRemove = Array.from(users).find(
          (u) => u.socketId === client.id,
        );
        if (userToRemove) {
          users.delete(userToRemove);
          this.server.to(room).emit('user-left', {
            userId: userInfo?.userId,
            room: room,
            message: `User ${userInfo?.userId} left the chat`,
          });
          if (users.size === 0) {
            this.rooms.delete(room);
            this.roomMetadata.delete(room);
          }
        }
      });
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string; receiverId: string },
  ) {
    const { senderId, receiverId } = data;
    if (!senderId || !receiverId) {
      client.emit('error', { message: 'SenderId and ReceiverId required' });
      return;
    }
    const userInfo = this.userSocketMap.get(client.id);
    if (!userInfo) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }
    const room = generateRoomId(senderId, receiverId);
    client.join(room);
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
      this.roomMetadata.set(room, { senderId, receiverId });
    }
    this.rooms.get(room)?.add(userInfo);
    client.emit('room-joined', {
      room,
      users: Array.from(this.rooms.get(room) || []),
    });
    client.to(room).emit('user-joined', { userId: userInfo.userId, room });
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { senderId: string; receiverId: string; message: string },
  ) {
    const { senderId, receiverId, message } = payload;
    if (!senderId || !receiverId || !message?.trim()) {
      client.emit('error', {
        message: 'senderId, receiverId and message are required',
      });
      return;
    }
    const room = generateRoomId(senderId, receiverId);
    const userInfo = this.userSocketMap.get(client.id);
    if (!userInfo) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    const chatMessage = new Chat();
    chatMessage.sender = { id: senderId } as User;
    chatMessage.receiver = { id: receiverId } as User;
    chatMessage.room = room;
    chatMessage.message = message.trim();
    const savedMessage = await this.chatRepository.save(chatMessage);

    const messageData = {
      id: savedMessage.id,
      sender: { id: senderId },
      receiver: { id: receiverId },
      message: message.trim(),
      room,
      create_at: savedMessage.created_at.toString(),
    };
    this.server.to(room).emit('new-message', messageData);
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    const userInfo = this.userSocketMap.get(client.id);
    if (userInfo && data.room) {
      client.to(data.room).emit('user-typing', {
        userId: userInfo.userId,
        room: data.room,
        isTyping: true,
      });
    }
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    const userInfo = this.userSocketMap.get(client.id);
    if (userInfo && data.room) {
      client.to(data.room).emit('user-typing', {
        userId: userInfo.userId,
        room: data.room,
        isTyping: false,
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  async getRecentMessages(room: string, limit: number = 50): Promise<Chat[]> {
    return await this.chatRepository.find({
      where: { room },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
function generateRoomId(userA: string, userB: string): string {
  return [userA, userB].sort().join('-');
}
