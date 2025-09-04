import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { UserToken } from 'src/modules/user-token/entities/user-token.entity';
import { Otp } from '../otp/entities/otp.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserToken, Otp])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
