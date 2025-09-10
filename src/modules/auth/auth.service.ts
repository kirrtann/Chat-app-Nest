import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User } from 'src/modules/user/entities/user.entity';
import { UserToken } from 'src/modules/user-token/entities/user-token.entity';
import { Otp } from '../otp/entities/otp.entity';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { VerifyOtpDto } from './dto/varifyopt.dto';
import { MESSAGE } from 'src/shared/constants/constant';
import { OtpType } from 'src/shared/constants/enum';
import sendOtp from 'src/shared/function/send-otp';
import generateRandomOtp from 'src/shared/function/generet-rendom-otp';
import response from 'utils/response';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
    @InjectRepository(Otp) private readonly otpRepository: Repository<Otp>,
  ) {}

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
      password: await this.hashPassword(createUserDto.password),
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
    if (!user)
      return response.badRequest(
        { message: MESSAGE.USER_NOT_FOUND, data: {} },
        res,
      );

    if (!(await bcrypt.compare(password, user.password))) {
      return response.badRequest(
        { message: MESSAGE.WRONG_CREDENTIALS, data: {} },
        res,
      );
    }

    const token = await this.saveUserToken(user);
    return response.successResponse(
      { message: MESSAGE.LOGIN, data: { id: user.id, name: user.name, token } },
      res,
    );
  }

  async verifySignupOtp(dto: VerifyOtpDto, res: Response) {
    const otp = await this.validateOtp(dto, OtpType.SIGN_UP, res);
    if (!otp) return;

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
    const otp = await this.validateOtp(dto, OtpType.FORGOT_PASSWORD, res);
    if (!otp) return;

    otp.is_verified = true;
    await this.otpRepository.save(otp);
    return response.successResponse(
      { message: MESSAGE.OTP_VERIFIED, data: { email: otp.email } },
      res,
    );
  }

  async resetPassword(email: string, newPassword: string, res: Response) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user)
      return response.badRequest(
        { message: MESSAGE.INVALID_RESET, data: {} },
        res,
      );

    user.password = await this.hashPassword(newPassword);
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

  async logout(user: User, token: string, res: Response) {
    const result = await this.userTokenRepository.update(
      { user: { id: user.id }, token, deleted_at: IsNull() },
      { deleted_at: new Date() },
    );

    if (!result.affected) {
      return response.badRequest(
        { message: MESSAGE.INVALID_LOGOUT, data: {} },
        res,
      );
    }

    return response.successResponse(
      { message: MESSAGE.LOGOUT_SUCCESS, data: {} },
      res,
    );
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private generateToken(userId: string): string {
    return jwt.sign({ id: userId, table: 'user' }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }

  private async saveUserToken(user: User): Promise<string> {
    await this.userTokenRepository.update(
      { user: { id: user.id }, deleted_at: IsNull() },
      { deleted_at: new Date() },
    );
    const newToken = this.generateToken(user.id);
    return (
      await this.userTokenRepository.save(
        this.userTokenRepository.create({ user, token: newToken }),
      )
    ).token;
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

  private async validateOtp(
    dto: VerifyOtpDto,
    type: OtpType,
    res: Response,
  ): Promise<Otp | null> {
    const otp = await this.otpRepository.findOne({
      where: { email: dto.email, otp: dto.otp, is_verified: false, type },
      relations: { user: true },
    });

    if (!otp || otp.expire_at <= Math.floor(Date.now() / 1000)) {
      if (otp) {
        otp.deleted_at = new Date().toISOString();
        await this.otpRepository.save(otp);
      }
      response.badRequest({ message: MESSAGE.INVALID_OTP, data: {} }, res);
      return null;
    }

    return otp;
  }
}
