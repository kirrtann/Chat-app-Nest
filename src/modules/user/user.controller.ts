import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':name')
  async findOne(@Param('name') name: string) {
    const user = await this.userService.FindUser(name);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
