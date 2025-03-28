import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';


@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

   @Get(':name')
   async findOne(@Param('name') name: string) {
     console.log(`Searching for user: ${name}`);
     const user = await this.userService.FindUser(name);
     if (!user) {
       throw new NotFoundException('User not found');
     }
     return user;
   }
}
