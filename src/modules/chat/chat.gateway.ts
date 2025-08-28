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

  private rooms: Map<string, Set<string>> = new Map();
  private userSocketMap: Map<string, string> = new Map();

  handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;

      if (!userId) {
        client.emit('error', { message: 'User ID required' });
        client.disconnect();
        return;
      }

      this.userSocketMap.set(client.id, userId);

      client.emit('connected', {
        message: 'Successfully connected',
        socketId: client.id,
      });
    } catch (error) {
      console.error('Connection error:', error);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const userId = this.userSocketMap.get(client.id);
      this.userSocketMap.delete(client.id);

      this.rooms.forEach((users, room) => {
        if (users.has(client.id)) {
          users.delete(client.id);

          this.server.to(room).emit('user-left', {
            userId: userId,
            room: room,
            message: `User ${userId} left the chat`,
          });

          if (users.size === 0) {
            this.rooms.delete(room);
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
    @MessageBody() room: string,
  ) {
    try {
      if (!room || typeof room !== 'string') {
        client.emit('error', { message: 'Invalid room ID' });
        return;
      }

      const userId = this.userSocketMap.get(client.id);
      if (!userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      client.join(room);

      if (!this.rooms.has(room)) {
        this.rooms.set(room, new Set());
      }
      this.rooms.get(room)?.add(client.id);

      const roomUsers = Array.from(this.rooms.get(room) || [])
        .map((socketId) => this.userSocketMap.get(socketId))
        .filter(Boolean);

      client.emit('room-joined', {
        room: room,
        users: roomUsers,
        message: 'Successfully joined room',
      });

      client.to(room).emit('user-joined', {
        userId: userId,
        room: room,
        users: roomUsers,
        message: `User ${userId} joined the chat`,
      });
    } catch (error) {
      console.error(' Join room error:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { room: string; message: string },
  ) {
    try {
      const { room, message } = payload;

      if (!room || !message?.trim()) {
        client.emit('error', { message: 'Room and message are required' });
        return;
      }

      const userId = this.userSocketMap.get(client.id);
      if (!userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const participants = this.getRoomParticipants(room);

      if (participants.length < 2) {
      }

      const receiver = participants.find((id) => id !== userId) || 'unknown';

      // Save message to database
      const chatMessage = new Chat();
      chatMessage.sender = userId;
      chatMessage.receiver = receiver;
      chatMessage.room = room;
      chatMessage.message = message.trim();

      const savedMessage = await this.chatRepository.save(chatMessage);

      // Broadcast message to all users in room
      const messageData = {
        id: savedMessage.id,
        userId: userId,
        sender: userId,
        receiver: receiver,
        message: message.trim(),
        room: room,
        timestamp: savedMessage.created_at.toISOString(),
      };

      this.server.to(room).emit('new-message', messageData);
    } catch (error) {
      console.error(' Send message error:', error);
      client.emit('error', {
        message: 'Failed to send message',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { room: string },
  ) {
    const userId = this.userSocketMap.get(client.id);
    if (userId && data.room) {
      client.to(data.room).emit('user-typing', {
        userId: userId,
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
    const userId = this.userSocketMap.get(client.id);
    if (userId && data.room) {
      client.to(data.room).emit('user-typing', {
        userId: userId,
        room: data.room,
        isTyping: false,
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  private getRoomParticipants(room: string): string[] {
    const users = this.rooms.get(room);
    if (!users) return [];

    return Array.from(users)
      .map((socketId) => this.userSocketMap.get(socketId))
      .filter(Boolean) as string[];
  }

  async getRecentMessages(room: string, limit: number = 50): Promise<Chat[]> {
    return await this.chatRepository.find({
      where: { room },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
