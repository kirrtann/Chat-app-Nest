import { Chat } from 'src/modules/chat/entities/chat.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { UserStatus } from 'src/shared/constants/enum';
import { DefaultEntity } from 'src/shared/entities/DefaultEntity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class Contact extends DefaultEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  contact_email: string;

  @Column()
  contact_name: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
  status: string;
}
