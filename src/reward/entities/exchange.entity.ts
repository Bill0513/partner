import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Exchange {
  @PrimaryGeneratedColumn({ comment: 'id' })
  id: number;

  @Column({ comment: '花费奖励', nullable: false })
  reward: number;

  @Column({ comment: '奖励id' })
  rewardId: number;

  @Column({ comment: '奖励标题' })
  rewardTitle: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed'],
    comment: '状态',
    default: 'pending',
  })
  status: 'pending' | 'completed';

  @Column({ comment: '发布人id' })
  publishId: number;

  @Column({ comment: '发布人姓名' })
  publishName: string;

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
