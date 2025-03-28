import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3002, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
   host: '0.0.0.0',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    console.log(' User Connected:', client.id, new Date().toLocaleTimeString());
  }

  handleDisconnect(client: Socket) {
    console.log('User Disconnected:', client.id);

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

  @SubscribeMessage('join-private-room')
  handleJoinPrivateRoom(client: Socket, data: { room: string }) {
    client.join(data.room);

    if (!this.rooms.has(data.room)) {
      this.rooms.set(data.room, new Set());
    }
    this.rooms.get(data.room)?.add(client.id);

    console.log(` User ${client.id} joined private room: ${data.room}`);

    this.server.to(data.room).emit('user-update', {
      users: Array.from(this.rooms.get(data.room) || []),
      message: `User ${client.id} joined private chat.`,
    });
  }

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

  @SubscribeMessage('private-message')
  handlePrivateMessage(
    client: Socket,
    payload: { room: string; message: string },
  ) {
    const { room, message } = payload;

    console.log(` Message from ${client.id}: ${message}`);

    this.server
      .to(room)
      .emit('private-message', { user: client.id, text: message });
  }
}
