import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class SubTask {
  @PrimaryGeneratedColumn({ comment: '子任务id' })
  id: number;

  @Column({ comment: '标题' })
  title: string;

  @Column({ comment: '描述', nullable: true })
  description: string;

  @Column({ comment: '任务id' })
  taskId: number;

  @Column({ type: 'enum', enum: ['pending', 'completed'], comment: '状态' })
  status: 'pending' | 'completed';

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
