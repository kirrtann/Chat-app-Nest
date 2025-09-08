import { User } from 'src/modules/user/entities/user.entity';
import { DefaultEntity } from 'src/shared/entities/DefaultEntity';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('chat')
export class Chat extends DefaultEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column()
  sender_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column()
  receiver_id: string;

  @Column()
  room: string;

  @Column('text')
  message: string;

  @Column({ default: false })
  is_read: boolean;
}
