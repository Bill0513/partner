// reward-like.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Unique(['userId', 'rewardId']) // 保证每用户每奖励只能有一个 like 记录
export class RewardLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  rewardId: number;

  @CreateDateColumn({ comment: '创建时间' })
  createtime: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatetime: Date;
}
