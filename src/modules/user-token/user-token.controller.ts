import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserTokenService } from './user-token.service';
import { CreateUserTokenDto } from './dto/create-user-token.dto';
import { UpdateUserTokenDto } from './dto/update-user-token.dto';

@Controller('user-token')
export class UserTokenController {
  constructor(private readonly userTokenService: UserTokenService) {}

 
}
