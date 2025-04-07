import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { Chat } from './entities/chat.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chat,User])],
  controllers: [ChatController],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
