import { Controller,  Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';

import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    return await this.authService.signUp(createUserDto, res);
  }

  
}
