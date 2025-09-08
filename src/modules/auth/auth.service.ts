import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { UserToken } from 'src/modules/user-token/entities/user-token.entity';
import { MESSAGE } from 'src/shared/constants/constant';
import { Otp } from '../otp/entities/otp.entity';
import { OtpType } from 'src/shared/constants/enum';
import sendOtp from 'src/shared/function/send-otp';
import response from 'utils/response';
import { Response } from 'express';
import generateRandomOtp from 'src/shared/function/generet-rendom-otp';
import { VerifyOtpDto } from './dto/varifyopt.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
    @InjectRepository(Otp) private readonly otpRepository: Repository<Otp>,
  ) {}

  private generateToken(userId: string): string {
    return jwt.sign({ id: userId, table: 'user' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }
  private isTokenExpired(token: string): boolean {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return false;
    } catch {
      return true;
    }
  }

  private async saveUserToken(user: User, token: string): Promise<string> {
    const existing = await this.userTokenRepository.findOne({
      where: { user: { id: user.id }, deleted_at: null },
    });
    if (existing) {
      if (this.isTokenExpired(existing.token)) {
        existing.token = token;
        await this.userTokenRepository.save(existing);
        return token;
      }
      await this.userTokenRepository.save(existing);
      return existing.token;
    }
    const newToken = this.userTokenRepository.create({
      user,
      token,
    });
    const result = await this.userTokenRepository.save(newToken);
    return result.token;
  }

  private async createAndSendOtp(user: User, type: OtpType): Promise<void> {
    const otpCode = generateRandomOtp();
    const otp = this.otpRepository.create({
      user,
      otp: otpCode,
      email: user.email,
      type,
      is_verified: false,
      expire_at: Math.floor((Date.now() + 600000) / 1000),
    });
    await this.otpRepository.save(otp);
    await sendOtp(user, otpCode);
  }

  async signUp(createUserDto: CreateUserDto, res: Response) {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing?.is_verified) {
      return response.badRequest(
        {
          message: MESSAGE.EMAIL_EXISTS_VERIFIED(createUserDto.email),
          data: { email: createUserDto.email },
        },
        res,
      );
    }
    const user = this.userRepository.create({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
      is_verified: false,
    });
    const savedUser = await this.userRepository.save(user);
    await this.createAndSendOtp(savedUser, OtpType.SIGN_UP);
    return response.successResponse(
      {
        message: MESSAGE.OTP_SENT(savedUser.email),
        data: { email: savedUser.email },
      },
      res,
    );
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.userRepository.findOne({
      where: { email, is_verified: true },
    });
    if (!user) {
      return response.badRequest(
        { message: MESSAGE.USER_NOT_FOUND, data: {} },
        res,
      );
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return response.badRequest(
        { message: MESSAGE.WRONG_CREDENTIALS, data: {} },
        res,
      );
    }
    const token = this.generateToken(user.id);
    await this.saveUserToken(user, token);
    return response.successResponse(
      {
        message: MESSAGE.LOGIN,
        data: { id: user.id, name: user.name, token },
      },
      res,
    );
  }

  async verifySignupOtp(dto: VerifyOtpDto, res: Response) {
    const otp = await this.otpRepository.findOne({
      where: {
        email: dto.email,
        otp: dto.otp,
        is_verified: false,
        type: OtpType.SIGN_UP,
      },
      relations: { user: true },
    });
    if (!otp) {
      return response.badRequest(
        { message: MESSAGE.INVALID_OTP, data: {} },
        res,
      );
    }
    if (otp.expire_at <= Math.floor(Date.now() / 1000)) {
      otp.deleted_at = new Date().toISOString();
      await this.otpRepository.save(otp);
      return response.badRequest(
        { message: MESSAGE.INVALID_OTP, data: {} },
        res,
      );
    }
    otp.is_verified = true;
    await this.otpRepository.save(otp);
    otp.user.is_verified = true;
    await this.userRepository.save(otp.user);
    return response.successResponse(
      {
        message: MESSAGE.CREATE_ACCOUNT_SUCCESS,
        data: { id: otp.user.id, email: otp.user.email },
      },
      res,
    );
  }

  async forgotPassword(email: string, res: Response) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return response.badRequest(
        { message: MESSAGE.RECORD_NOT_FOUND('Email'), data: {} },
        res,
      );
    }
    await this.createAndSendOtp(user, OtpType.FORGOT_PASSWORD);
    return response.successResponse(
      { message: MESSAGE.PASSWORD_RESET_SENT(email), data: { email } },
      res,
    );
  }

  async verifyForgotPasswordOtp(dto: VerifyOtpDto, res: Response) {
    const otp = await this.otpRepository.findOne({
      where: {
        email: dto.email,
        otp: dto.otp,
        is_verified: false,
        type: OtpType.FORGOT_PASSWORD,
      },
      relations: { user: true },
    });
    if (!otp) {
      return response.badRequest(
        { message: MESSAGE.INVALID_OTP, data: {} },
        res,
      );
    }
    if (otp.expire_at <= Math.floor(Date.now() / 1000)) {
      otp.deleted_at = new Date().toISOString();
      await this.otpRepository.save(otp);
      return response.badRequest(
        { message: MESSAGE.INVALID_OTP, data: {} },
        res,
      );
    }

    otp.is_verified = true;
    await this.otpRepository.save(otp);
    return response.successResponse(
      { message: MESSAGE.OTP_VERIFIED, data: { email: otp.email } },
      res,
    );
  }

  async resetPassword(email: string, newPassword: string, res: Response) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return response.badRequest(
        { message: MESSAGE.INVALID_RESET, data: {} },
        res,
      );
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    return response.successResponse(
      { message: MESSAGE.PASSWORD_RESET_SUCCESS, data: {} },
      res,
    );
  }

  async resendOtp(email: string, res: Response) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return response.badRequest(
        { message: MESSAGE.RECORD_NOT_FOUND('email'), data: {} },
        res,
      );
    }
    await this.otpRepository.update(
      { email, is_verified: false, deleted_at: null },
      { deleted_at: new Date().toISOString() },
    );
    await this.createAndSendOtp(user, OtpType.SIGN_UP);
    return response.successResponse(
      { message: MESSAGE.NEW_OTP_SENT(email), data: { email } },
      res,
    );
  }

  async logout(userId: string, res: Response) {
    const userToken = await this.userTokenRepository.findOne({
      where: {
        user: { id: userId },
        deleted_at: null,
      },
      relations: ['user'],
    });
    if (!userToken) {
      return res.status(404).json({ message: 'No active session found' });
    }
    console.log(userToken);
    console.log(userId);
    await this.userTokenRepository.update(userToken.id, {});
    return response.successResponse(
      {
        message: 'logout sussecful',
        data: { userId },
      },
      res,
    );
  }
}
