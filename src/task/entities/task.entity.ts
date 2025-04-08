import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Task {
  @PrimaryGeneratedColumn({ comment: '任务id' })
  id: number;

  @Column({ comment: '标题', nullable: false })
  title: string;

  @Column({ comment: '描述', nullable: false })
  description: string;

  @Column({ comment: '日期', nullable: false })
  date: string;

  @Column({ comment: '时间', nullable: false })
  time: string;

  @Column({ type: 'enum', enum: ['high', 'medium', 'low'], comment: '优先级' })
  priority: 'high' | 'medium' | 'low';

  @Column({ comment: '奖励' })
  reward: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'in-progress', 'completed'],
    comment: '状态',
  })
  status: 'pending' | 'in-progress' | 'completed';

  @Column({ comment: '位置', nullable: true })
  location: string;

  @CreateDateColumn({ comment: '创建时间' })
  createtime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatetime: Date;

  @Column({ comment: '创建人id' })
  createby: number;

  @Column({ comment: '创建人名称' })
  createName: string;

  @Column({ comment: '更新人id', nullable: true })
  updateby: number;

  @Column({ comment: '更新人名称', nullable: true })
  updateName: string;
}
