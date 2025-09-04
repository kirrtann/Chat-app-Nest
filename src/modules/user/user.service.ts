import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async FindUser(name: string): Promise<User[]> {
    return this.userRepository.find({
      where: { name: ILike(`%${name}%`), deleted_at: null },
      take: 10,
    });
  }
}
