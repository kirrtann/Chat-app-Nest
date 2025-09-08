import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';
import response from 'utils/response';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async getAllUsers(name: string, res: Response) {
    const users = await this.userRepository.find({
      where: [
        { name: ILike(`${name}%`), is_verified: true },
        { email: ILike(`${name}%`), is_verified: true },
      ],
      select: {
        id: true,
        name: true,
      },
    });

    if (users.length > 0) {
      return response.successResponse(
        {
          message: 'Users found successfully',
          data: users,
        },
        res,
      );
    }

    return response.recordNotFound(
      {
        message: 'No users found',
        data: [],
      },
      res,
    );
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return user;
  }
}
