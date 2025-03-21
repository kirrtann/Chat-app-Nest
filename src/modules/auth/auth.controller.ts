import { Controller,  Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';

import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { VarifyOptDto } from './dto/varifyopt.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    return await this.authService.signUp(createUserDto, res);
  }
  @Post('login')
  async login(@Body() body, @Res() res: Response) {
    const { email, password } = body;
    return this.authService.login(email, password, res);
  }
  

  @Post('verifyotp')
  async verifyOtp(@Body() varifyOptDto: VarifyOptDto, ) {
    return await this.authService.verifySignupOtp(varifyOptDto);
  }
}
