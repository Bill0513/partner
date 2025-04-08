import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RewardCategory {
  DATE = 'date',
  FOOD = 'food',
  SERVICE = 'service',
  GIFT = 'gift',
  OTHER = 'other',
}

export enum RewardStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

@Entity()
export class Reward {
  @PrimaryGeneratedColumn({ comment: 'id' })
  id: number;

  @Column({ comment: '标题', nullable: false })
  title: string;

  @Column({ comment: '奖励', nullable: false })
  reward: number;

  @Column({ comment: '描述', nullable: true })
  description: string;

  @Column({ comment: '图片', nullable: true })
  image: string;

  @Column({
    comment: '分类',
    type: 'enum',
    enum: RewardCategory,
    nullable: false,
  })
  category: RewardCategory;

  @Column({ comment: '开始日期', nullable: true })
  startDate: string;

  @Column({ comment: '结束日期', nullable: true })
  endDate: string;

  @Column({ type: 'enum', enum: ['permanent', 'limited'], comment: '时长' })
  validity: 'permanent' | 'limited';

  @Column({ comment: '总数量' })
  totalNum: number;

  @Column({ comment: '可使用' })
  enableNum: number;

  @Column({ comment: '是否热门 0非热门，1热门', default: 0 })
  isHot: number;

  @Column({
    type: 'enum',
    enum: RewardStatus,
    comment: '状态',
    default: RewardStatus.PENDING,
  })
  status: RewardStatus;

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
