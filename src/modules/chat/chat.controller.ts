import { Chat } from './entities/chat.entity';
import { Body, Controller, Post, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity'; // Add this import

@Controller('chat')
export class ChatController {
  constructor(
    @InjectRepository(Chat) private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User) private readonly userRepository: Repository<User>, // Add this injection
  ) {}

  @Post('GetChatHistory/:roomId')
  async getChatHistory(
    @Param('roomId') roomId: string,
    @Body() body: { userId: string }
  ) {
    const messages = await this.chatRepository.find({
      where: {
        room: roomId,
      },
    }); 

    if (messages.length > 0) {
      return {
        status: true,
        message: 'Chat history found',
        data: messages,
      };
    }

    return {
      status: false,
      message: 'No chat history found',
      data: [],
    };
  }

  @Post('getchat')
  async Getchat(@Body() body: { userId: string, otherUserEmail: string }) {
    // First, find the other user's ID from their email
    const otherUser = await this.userRepository.findOne({
      where: { email: body.otherUserEmail }
    });

    if (!otherUser) {
      throw new NotFoundException('User not found with the provided email');
    }

    const messages = await this.chatRepository.find({
      where: [
        {
          sender: body.userId,
          receiver: otherUser.id,
        },
        {
          sender: otherUser.id,
          receiver: body.userId,
        }
      ],
      order: {
        created_at: 'ASC'
      }
    });

    if (messages.length > 0) {
      return {
        status: true,
        message: 'Chat history found',
        data: messages,
      };
    }

    return {
      status: false,
      message: 'No chat history found',
      data: [],
    };
  }
}
