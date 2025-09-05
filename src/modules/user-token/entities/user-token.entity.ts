import { User } from 'src/modules/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class UserToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'fk_user' })
  user: User;

  @Column({ type: 'text' })
  token: string;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'NOW()',
  })
  created_at: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: string;
}
