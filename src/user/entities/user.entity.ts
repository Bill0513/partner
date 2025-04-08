import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn({ comment: '用户id' })
  id: number;

  @Column({ comment: '唯一id', unique: true, nullable: true, default: null })
  uId: string;

  @Column({ comment: '伙伴id', nullable: true })
  partnerId: number;

  @Column({ comment: '绑定日期', nullable: true })
  bindingTime: Date;

  @Column({ comment: '积分', nullable: true, default: 0 })
  reward: number;

  @Column({ comment: '头像', nullable: true, default: null })
  avatar: string;

  @Column({ comment: '用户名', unique: true, nullable: false })
  username: string;

  @Column({ comment: '密码', nullable: false })
  password: string;

  @Column({ comment: '昵称', default: null, unique: false })
  nickname: string;

  @Column({ comment: '性别,男性为1,女性为2,未知为3', default: 1 })
  sex: number;

  @Column({ length: 45, default: null, unique: false, comment: '手机号' })
  phone: string;

  @Column({ length: 45, default: null, unique: false, comment: '邮箱' })
  email: string;

  @Column({
    type: 'int',
    default: 2,
    unique: false,
    comment: '用户类型：0超级管理员,1管理员,2普通用户',
  })
  userType: number;

  @Column({
    type: 'boolean',
    default: true,
    unique: false,
    comment: '用户状态',
  })
  status: boolean;

  @Column({ comment: '用户描述', nullable: true })
  description: string;

  @CreateDateColumn({ comment: '创建时间' })
  createtime: string;

  @UpdateDateColumn({ comment: '更新时间' }) //自动生成并自动更新列
  updatetime: string;
}
