import { Column,  PrimaryGeneratedColumn, Unique } from 'typeorm';

export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column(Unique)
  email: string;

  @Column()
  password: string;

  @Column()
  birth_date: Date; 
  
  @Column()
  created_at: Date;

  @Column()
  updateda_at: Date;

  @Column()
  deleted_at: Date;
}
