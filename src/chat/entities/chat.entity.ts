import { DefaultEntity } from 'src/shared/entities/DefaultEntity';
import { Column, Entity } from 'typeorm';
@Entity()
export class Chat extends DefaultEntity {
  @Column({ type: 'character varying' })
  chat: string;

  @Column({ type: 'character varying' })
  sender: string;

  @Column({ type: 'character varying' })
  receiver: string;

  @Column({ type: 'character varying' })
  room: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;
}
