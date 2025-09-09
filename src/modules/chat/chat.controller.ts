import { Chat } from './entities/chat.entity';
import { Body, Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { AuthGuard } from 'src/core/guard/auth.guard';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('history') async getChatHistory(
    @Body() body: { userId: string; otherUserId: string },
  ) {
    try {
      const otherUser = await this.userRepository.findOne({
        where: { id: body.otherUserId },
      });
      if (!otherUser) {
        return { status: false, message: 'User not found', data: [] };
      }
      const messages = await this.chatRepository.find({
        where: [
          { sender: { id: body.userId }, receiver: { id: body.otherUserId } },
          { sender: { id: body.otherUserId }, receiver: { id: body.userId } },
        ],
        relations: ['sender', 'receiver'],
        order: { created_at: 'ASC' },
        select: {
          id: true,
          message: true,
          created_at: true,
          sender: { id: true, name: true },
          receiver: { id: true, name: true },
        },
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

  @Get('getUserChatlist/:userId')
  async getUserChatlist(@Param('userId') userId: string) {
    try {
      const chats = await this.chatRepository.find({
        where: [{ sender: { id: userId } }, { receiver: { id: userId } }],
        order: { created_at: 'DESC' },
        relations: ['sender', 'receiver'],
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
            chat.sender.id === userId ? chat.receiver.id : chat.sender.id,
          ),
        ),
      ];
      const otherUsers = await this.userRepository.find({
        where: { id: In(otherUserIds) },
        select: ['id', 'name'],
      });

      const chatList = otherUsers.map((user) => {
        const lastMessage = chats.find(
          (c) => c.sender.id === user.id || c.receiver.id === user.id,
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

  @Post('deletechatlist')
  async deleteChatList(
    @Body() body: { userId: string; otherUserId: string[] | string },
  ) {
    try {
      const otherUserIds = Array.isArray(body.otherUserId)
        ? body.otherUserId
        : [body.otherUserId];

      if (!body.userId || otherUserIds.length === 0) {
        return { success: false, message: 'Invalid request data' };
      }

      await this.chatRepository
        .createQueryBuilder()
        .update(Chat)
        .set({ deleted_at: new Date() })
        .where(
          '(sender_id = :userId AND receiver_id IN (:...otherUserIds)) OR (sender_id IN (:...otherUserIds) AND receiver_id = :userId)',
          { userId: body.userId, otherUserIds },
        )
        .execute();

      return { success: true, message: 'Chats deleted successfully' };
    } catch (error) {
      console.error('Error deleting chats:', error);
      return { success: false, message: 'Failed to delete chats', error };
    }
  }
}
