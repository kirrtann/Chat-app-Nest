import { User } from "src/modules/user/entities/user.entity";
import { OtpType } from "src/shared/constants/enum";
import { Column, JoinColumn, ManyToOne } from "typeorm";

export class Otp {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer' })
  otp: number;

  @Column({ type: 'character varying' })
  email: string;

  @Column({ type: 'enum', enum: OtpType })
  type: string;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'integer' })
  expire_at: number;
}
