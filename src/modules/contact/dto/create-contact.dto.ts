import { User } from './../../user/entities/user.entity';
export class CreateContactDto {
  UserId: User;
  email: string;
  name: string;
}
