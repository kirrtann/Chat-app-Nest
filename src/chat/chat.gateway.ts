import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>
  ) {}

  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();
  private userSocketMap: Map<string, string> = new Map(); // Maps socket.id to userId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.userSocketMap.set(client.id, userId);
      console.log('User Connected:', { socketId: client.id, userId, time: new Date().toLocaleTimeString() });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.userSocketMap.get(client.id);
    this.userSocketMap.delete(client.id);
    console.log('User Disconnected:', { socketId: client.id, userId });

    this.rooms.forEach((users, room) => {
      if (users.has(client.id)) {
        users.delete(client.id);
        this.server.to(room).emit('user-update', {
          users: Array.from(users),
          message: `User ${client.id} left room ${room}`,
        });

        if (users.size === 0) {
          this.rooms.delete(room);
        }
      }
    });
  }

  // @SubscribeMessage('join-private-room')
  // handleJoinPrivateRoom(client: Socket, data: { room: string }) {
  //   client.join(data.room);

  //   if (!this.rooms.has(data.room)) {
  //     this.rooms.set(data.room, new Set());
  //   }
  //   this.rooms.get(data.room)?.add(client.id);

  //   console.log(` User ${client.id} joined private room: ${data.room}`);

  //   this.server.to(data.room).emit('user-update', {
  //     users: Array.from(this.rooms.get(data.room) || []),
  //     message: `User ${client.id} joined private chat.`,
  //   });
  // }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);

    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)?.add(client.id);

    console.log(`User ${client.id} joined room: ${room}`);

    this.server.to(room).emit('user-update', {
      users: Array.from(this.rooms.get(room) || []),
      message: `User ${client.id} joined room ${room}`,
    });

    client.emit('room-joined', Array.from(this.rooms.get(room) || []));
  }

  private getRoomParticipants(room: string): string[] {
    const users = this.rooms.get(room);
    if (!users) return [];
    return Array.from(users).map(socketId => this.userSocketMap.get(socketId)).filter(Boolean) as string[];
  }

  @SubscribeMessage('private-message')
  async handlePrivateMessage(
    client: Socket,
    payload: { room: string; message: string },
  ) {
    const { room, message } = payload;
    const userId = this.userSocketMap.get(client.id);
    
    // Get participants in the room
    const participants = this.getRoomParticipants(room);
    
    // Verify exactly 2 participants for private chat
    if (participants.length !== 2) {
      client.emit('error', { message: 'Private chat requires exactly 2 participants' });
      return;
    }

    // Determine receiver (the other participant)
    const receiver = participants.find(id => id !== userId);

    // Create new chat entity
    const chatMessage = new Chat();
    chatMessage.sender = userId;
    chatMessage.receiver = receiver;
    chatMessage.room = room;
    chatMessage.message = message;
    chatMessage.timestamp = new Date();
    
    // Save to database
    await this.saveChat(chatMessage);

    console.log(`Message from ${userId} to ${receiver}: ${message}`);

    this.server
      .to(room)
      .emit('private-message', { 
        user: client.id, 
        userId: userId,
        receiver: receiver,
        text: message, 
        room: room,
        timestamp: chatMessage.timestamp
      });
  }

  async saveChat(chat: Chat) {  
    try {
      return await this.chatRepository.save(chat);
    } catch (error) {
      console.error('Error saving chat:', error);
      throw error;
    }
  }

  async getChat(room: string) {
    return await this.chatRepository.find({ 
      where: { room },
      order: { timestamp: 'ASC' } // Order messages by timestamp
    });
  }

  async getChatByUser(sender: string, receiver: string) {
    return await this.chatRepository.find({
      where: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
      order: { timestamp: 'ASC' } // Order messages by timestamp
    });
  }
}
