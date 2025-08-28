import { Chat } from './entities/chat.entity';
import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

@Controller('chat')
export class ChatController {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('history')
  async getChatHistory(
    @Body() body: { userId: string; otherUserEmail: string },
  ) {
    try {
      const otherUser = await this.userRepository.findOne({
        where: { email: body.otherUserEmail },
      });

      if (!otherUser) {
        return {
          status: false,
          message: 'User not found',
          data: [],
        };
      }
      const roomId = [body.userId, body.otherUserEmail].sort().join('-');

      const messages = await this.chatRepository.find({
        where: { room: roomId },
        order: { created_at: 'ASC' },
      });

      return {
        status: true,
        message: messages.length > 0 ? 'Chat history found' : 'No messages yet',
        data: messages,
      };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return {
        status: false,
        message: 'Failed to fetch chat history',
        data: [],
      };
    }
  }

  @Get('rooms/:userId')
  async getUserRooms(@Param('userId') userId: string) {
    try {
      const rooms = await this.chatRepository
        .createQueryBuilder('chat')
        .select(['chat.room', 'MAX(chat.created_at) as last_message_time'])
        .where('chat.sender = :userId OR chat.receiver = :userId', { userId })
        .groupBy('chat.room')
        .orderBy('last_message_time', 'DESC')
        .getRawMany();

      return {
        status: true,
        message: 'User rooms found',
        data: rooms,
      };
    } catch (error) {
      console.error('Error fetching user rooms:', error);
      return {
        status: false,
        message: 'Failed to fetch rooms',
        data: [],
      };
    }
  }

  @Post('search-users')
  async searchUsers(@Body() body: { query: string; currentUserId: string }) {
    try {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.email LIKE :query OR user.name LIKE :query', {
          query: `%${body.query}%`,
        })
        .andWhere('user.id != :currentUserId', {
          currentUserId: body.currentUserId,
        })
        .take(10)
        .getMany();

      return {
        status: true,
        message: 'Users found',
        data: users,
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        status: false,
        message: 'Failed to search users',
        data: [],
      };
    }
  }
}
