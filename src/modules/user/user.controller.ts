import { Controller, Get, Param, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import response from 'utils/response';
import { MESSAGE } from 'src/shared/constants/constant';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('allUsers/:name')
  async getallusers(@Param('name') email: string, @Res() res: Response) {
    return await this.userService.getAllUsers(email, res);
  }

  @Get('profile')
  async myProfile(@CurrentUser() user: User, @Res() res: Response) {
    const result = await this.userService.getUserProfile(user.id);
    return response.successResponse(
      {
        message: MESSAGE.RECORD_FOUND('Profile'),
        data: result,
      },
      res,
    );
  }
}
