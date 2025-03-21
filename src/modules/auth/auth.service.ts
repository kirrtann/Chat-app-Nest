import { BadRequestException, Injectable } from '@nestjs/common';

import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import response from 'utils/response';
import * as jwt from 'jsonwebtoken';
import { UserToken } from 'src/modules/user-token/entities/user-token.entity';
import { MESSAGE } from 'src/shared/constants/constant';
import { Otp } from '../otp/entities/otp.entity';
import { VarifyOptDto } from './dto/varifyopt.dto';
import { OtpType } from 'src/shared/constants/enum';
import generateRandomOtp from 'src/shared/function/generet-rendom-otp';
import sendOtp from 'src/shared/function/send-otp';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  async getToken(table: string, entity: User): Promise<string> {
    const token = await this.userTokenRepository.findOne({
      where: {
        [table]: { id: entity.id },
      },
    });

    // generate token
    const newToken = this.generateToken(entity.id, 'fk_user', 'user');

    if (token) {
      const isExpired = await this.isTokenExpired(token);

      if (isExpired) {
        // Update with new token
        await this.userTokenRepository.save({
          id: token.id,
          token: newToken,

          login_time: new Date().toISOString(),
        });
        // New Token
        return newToken;
      }

      // Update Login Time
      await this.userTokenRepository.save({
        id: token.id,

        login_time: new Date().toISOString(),
      });
      // Old token which is not expired
      return token.token;
    }

    // Create new token
    const result = await this.userTokenRepository.save({
      [table]: { id: entity.id },
      token: newToken,

      login_time: new Date().toISOString(),
    });
    return result.token;
  }
  generateToken = (id, column, table) => {
    return jwt.sign({ id, column, table }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  };

  isTokenExpired = async (token) => {
    try {
      const valid = await jwt.verify(token, process.env.JWT_SECRET);
      if (valid) {
        return false;
      } else {
        return true;
      }
    } catch (err) {
      return true;
    }
  };
  createUserToken = async (payload) => {
    const user = await this.userRepository.findOne({
      where: { id: payload.fk_user },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isExist = await this.userTokenRepository.findOne({
      where: { user: { id: payload.fk_user }, deleted_at: null },
    });

    if (isExist) {
      const isExpired = await this.isTokenExpired(isExist.token);
      if (isExpired) {
        isExist.token = payload.token;
        await this.userTokenRepository.save(isExist);
        return isExist.token;
      } else {
        return isExist.token;
      }
    } else {
      const token = new UserToken();
      token.user = user;
      token.token = payload.token;
      const result = await this.userTokenRepository.save(token);
      return result.token;
    }
  };

  async signUp(createUserDto: CreateUserDto, res: Response) {
    const already = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (already) {
      return response.badRequest(
        {
          message: 'Email already exists',
          data: { email: createUserDto.email },
        },
        res,
      );
    }

    // Create new user
    const user = new User();
    user.name = createUserDto.name;
    user.email = createUserDto.email;
    user.password = await bcrypt.hash(createUserDto.password, 10);
    user.birth_date = createUserDto.birth_date;
    user.is_verified = false; // User will be verified after OTP validation

    //  Save user first before creating OTP
    const savedUser = await this.userRepository.save(user);

    // Generate OTP
    const otpCode = generateRandomOtp();
    const otp = new Otp();
    otp.user = savedUser; // Now user has an ID
    otp.otp = otpCode;
    otp.email = savedUser.email;
    otp.type = OtpType.SIGN_UP;
    otp.expire_at = Math.floor((Date.now() + 600000) / 1000); // Expires in 1 minutes

    await this.otpRepository.save(otp);
    await sendOtp(savedUser, otpCode);

    return response.successResponse(
      {
        message: `OTP sent to ${savedUser.email}. Please verify your email.`,
        data: { email: savedUser.email },
      },
      res,
    );
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return response.badRequest(
        { message: 'Email or password is wrong!', data: {} },
        res,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return response.badRequest(
        { message: 'Email or password is wrong!', data: {} },
        res,
      );
    }
    const token = this.generateToken(user.id, 'fk_user', 'user');
    await this.createUserToken({ fk_user: user.id, token });
    return response.successResponse(
      { message: 'Login successful', data: { id: user.id, token } },
      res,
    );
  }

  async verifySignupOtp(verifyOtpDto: VarifyOptDto) {
    const otp = await this.otpRepository.findOne({
      where: {
        email: verifyOtpDto.email,
        otp: verifyOtpDto.otp,
        is_verified: false,
        type: OtpType.SIGN_UP,
      },
      relations: {
        user: true,
      },
    });

    // If entered wrong otp
    if (!otp) {
      throw new BadRequestException(MESSAGE.INVALID_OTP);
    }
    const isExpired = otp.expire_at <= Math.floor(Date.now() / 1000);
    // const isExpired = otp.expire_at - Math.floor(Date.now() / 1000) > 0 ? false : true;

    // If otp expired
    if (isExpired) {
      // Delete Old OTP
      await this.otpRepository.update(otp.id, {
        deleted_at: new Date().toISOString(),
      });

      throw new BadRequestException(MESSAGE.INVALID_OTP);
    }

    // Verify OTP.
    await this.otpRepository.update(otp.id, {
      is_verified: true,
    });

    // Verify User
    await this.userRepository.update(otp.user.id, {
      is_verified: true,
    });

    const loginResponse = await this.getLoginResponse('user', otp.user);
    return loginResponse;
  }
  async getLoginResponse(table: 'user', entity: User) {
    const Token = await this.getToken(table, entity);
    return {
      [table]: {
        id: entity.id,
        name: entity.name,
        email: entity.email,
        
      },
      Token,
    };
  }
}
