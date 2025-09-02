import { Chat } from './entities/chat.entity';
import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
  async getChatHistory(@Body() body: { userId: string; otherUserId: string }) {
    try {
      const otherUser = await this.userRepository.findOne({
        where: { id: body.otherUserId },
      });

      if (!otherUser) {
        return {
          status: false,
          message: 'User not found',
          data: [],
        };
      }
      const messages = await this.chatRepository.find({
        where: [
          { sender: body.userId, receiver: body.otherUserId },
          { sender: body.otherUserId, receiver: body.userId },
        ],
        order: { created_at: 'ASC' },
        select: ['id', 'created_at', 'sender', 'receiver', 'message'],
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

  @Get('getUserChatlist/:userId')
  async getUserChatlist(@Param('userId') userId: string) {
    try {
      const chats = await this.chatRepository.find({
        where: [{ sender: userId }, { receiver: userId }],
        order: { created_at: 'DESC' },
      });

      if (!chats.length) {
        return {
          status: true,
          message: 'No chats found',
          data: [],
        };
      }
      const otherUserIds = [
        ...new Set(
          chats.map((chat) =>
            chat.sender === userId ? chat.receiver : chat.sender,
          ),
        ),
      ];
      const otherUsers = await this.userRepository.find({
        where: { id: In(otherUserIds) },
        select: ['id', 'name'],
      });

      const chatList = otherUsers.map((user) => {
        const lastMessage = chats.find(
          (c) => c.sender === user.id || c.receiver === user.id,
        );
        return {
          userId: user.id,
          userName: user.name,
          lastMessage: lastMessage?.message || null,
          lastMessageAt: lastMessage?.created_at || null,
        };
      });
      return {
        status: true,
        message: 'Chat list fetched successfully',
        data: chatList,
      };
    } catch (error) {
      console.error('Error fetching chat list:', error);
      return {
        status: false,
        message: 'Error fetching chat list',
        error: error.message,
      };
    }
  }
}
