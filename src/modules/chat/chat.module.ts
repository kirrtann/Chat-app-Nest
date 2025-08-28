import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { Chat } from './entities/chat.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, User])],
  controllers: [ChatController],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
