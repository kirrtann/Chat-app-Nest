import { Exclude } from 'class-transformer';
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export class DefaultEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: string;

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updated_at: string;

  @Exclude()
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at: string | Date;
}
