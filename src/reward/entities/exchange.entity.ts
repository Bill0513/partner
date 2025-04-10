import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExchangeStatus {
  PENDING = 'pending', // 刚兑换
  IN_PROGRESS = 'in-progress', // 进行中
  COMPLETED = 'completed', // 完成
  REJECT = 'reject', // 拒绝
}

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

  @Column({ comment: '奖励描述' })
  rewardDescription: string;

  @Column({
    type: 'enum',
    enum: ExchangeStatus,
    comment: '状态',
    default: ExchangeStatus.PENDING,
  })
  status: ExchangeStatus;

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
