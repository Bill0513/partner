import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Rule {
  @PrimaryGeneratedColumn({ comment: 'id' })
  id: number;

  @Column({ comment: '标题', nullable: false })
  title: string;

  @Column({ comment: '奖励id', nullable: false })
  rewardId: number;

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
