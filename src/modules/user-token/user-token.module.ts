import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserToken } from './entities/user-token.entity';
import { UserTokenService } from './user-token.service';
import { UserTokenController } from './user-token.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserToken])],
  controllers: [UserTokenController],
  providers: [UserTokenService],
  exports: [TypeOrmModule],
})
export class UserTokenModule {}
