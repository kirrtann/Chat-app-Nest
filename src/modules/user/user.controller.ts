import { Controller, Get, Param, Res } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('allUsers/:name')
  async getallusers(@Param('name') email: string, @Res() res: Response) {
    return await this.userService.getAllUsers(email, res);
  }
}
