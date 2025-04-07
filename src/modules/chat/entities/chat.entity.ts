import { DefaultEntity } from 'src/shared/entities/DefaultEntity';
import {
  Entity,
  Column,
} from 'typeorm';

@Entity()
export class Chat extends DefaultEntity {


  @Column()
  sender: string;

  @Column()
  room: string;

  @Column('text')
  message: string;

  @Column({ nullable: true })
  receiver: string;
}
