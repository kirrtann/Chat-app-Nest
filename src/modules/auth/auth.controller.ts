import { Body, Controller, Post, Put, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

import { Response } from 'express';
import { VerifyOtpDto } from './dto/varifyopt.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() dto: CreateUserDto, @Res() res: Response) {
    return this.authService.signUp(dto, res);
  }

  @Post('login')
  login(
    @Body() dto: { email: string; password: string },
    @Res() res: Response,
  ) {
    return this.authService.login(dto.email, dto.password, res);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto, @Res() res: Response) {
    return this.authService.verifySignupOtp(dto, res);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: { email: string }, @Res() res: Response) {
    return this.authService.forgotPassword(dto.email, res);
  }

  @Post('verify-forgot-password-otp')
  verifyForgotPasswordOtp(@Body() dto: VerifyOtpDto, @Res() res: Response) {
    return this.authService.verifyForgotPasswordOtp(dto, res);
  }

  @Post('reset-password')
  resetPassword(
    @Body() dto: { email: string; newPassword: string },
    @Res() res: Response,
  ) {
    return this.authService.resetPassword(dto.email, dto.newPassword, res);
  }

  @Put('resend-otp')
  resendOtp(@Body() dto: { email: string }, @Res() res: Response) {
    return this.authService.resendOtp(dto.email, res);
  }
  @Put('logout')
  logout(@Body() dto: { userId: string }, @Res() res: Response) {
    return this.authService.logout(dto.userId, res);
  }
}
