// src/message/entities/message.entity.ts
import { MessageType } from 'src/constants';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MessageType })
  type: MessageType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
