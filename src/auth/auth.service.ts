import { Injectable } from '@nestjs/common';

import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import response from 'utils/response';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,

  ) {}

  async signUp(createUserDto: CreateUserDto, res: Response) {
        const already = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (already) {
      return response.badRequest(
        {
          message: 'Email is already exist',
          data: { email: createUserDto.email },
        },
        res,
      );
    }

    const user: User = new User();
    user.name = createUserDto.name;
    user.email = createUserDto.email;
    user.password = await bcrypt.hash(createUserDto.password, 10);
    user.birth_date = createUserDto.birth_date;
   
    const result = await this.userRepository.save(user);

    return response.successResponse(
      { message: 'Signup Successful', data: { id: result.id } },
      res,
    );
  }

 
}
