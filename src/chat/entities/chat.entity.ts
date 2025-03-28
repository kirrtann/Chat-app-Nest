import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sender: string;

  @Column()
  room: string;

  @Column('text')
  message: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  receiver: string;
}
