import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { VarifyOptDto } from './dto/varifyopt.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    return this.authService.signUp(createUserDto, res);
  }

  @Post('login')
  async login(
    @Body() loginDto: { email: string; password: string },
    @Res() res: Response,
  ) {
    return this.authService.login(loginDto.email, loginDto.password, res);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VarifyOptDto) {
    return this.authService.verifySignupOtp(verifyOtpDto);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: { email: string },
    @Res() res: Response,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto.email, res);
  }

  @Post('verify-forgot-password-otp')
  async verifyForgotPasswordOtp(@Body() verifyOtpDto: VarifyOptDto) {
    return this.authService.verifyForgotPasswordOtp(verifyOtpDto);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: { email: string; newPassword: string },
    @Res() res: Response,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.newPassword,

      res,
    );
  }
}
