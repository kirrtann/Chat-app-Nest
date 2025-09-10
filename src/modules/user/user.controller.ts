import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { AuthGuard } from 'src/core/guard/auth.guard';
@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('allUsers/:name')
  async getallusers(@Param('name') email: string, @Res() res: Response) {
    return await this.userService.getAllUsers(email, res);
  }

  @Get('profile')
  async myProfile(@CurrentUser() user: User, @Res() res: Response) {
    return await this.userService.getUserProfile(user.id, res);
  }
}
