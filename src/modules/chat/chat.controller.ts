import { Chat } from './entities/chat.entity';
import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('chat')
export class ChatController {
  constructor(
    @InjectRepository(Chat) private readonly chatRepository: Repository<Chat>,
  ) {}
  @Post('GetChatHistory')
  async getChatHistory(@Body() body: { userId: string; roomId: string }) {
    const messages = await this.chatRepository.find({
      where: {
        room: body.roomId,
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
}
