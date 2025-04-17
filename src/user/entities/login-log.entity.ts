// src/entities/login-log.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('login_log')
export class LoginLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '登录 IP（可拓展）' })
  ip: string;

  @Column({ comment: '设备信息（可拓展）', nullable: true })
  device: string;

  @Column({ comment: '登录日期（冗余字段，方便直接按日期查）', type: 'date' })
  loginDate: string; // 例如 "2023-01-01"

  @Column({ comment: '用户id' })
  userId: number;

  @CreateDateColumn({ comment: '第一次登录时间' })
  createtime: Date;
}
