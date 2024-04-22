import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn({ comment: '用户id' })
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '用户名',
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '密码',
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '昵称',
  })
  nick_name: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '邮箱',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '头像',
  })
  head_pic: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: '手机号',
  })
  phone_number: string;

  @Column({
    type: 'boolean',
    comment: '是否被冻结',
  })
  is_forzen: boolean;

  @Column({
    type: 'boolean',
    comment: '是否是管理员',
  })
  is_admin: boolean;

  @CreateDateColumn({
    comment: '创建时间',
  })
  create_time: Date;

  @UpdateDateColumn({
    comment: '更新时间',
  })
  update_time: Date;

  @JoinTable({
    name: 'user_roles_relations',
  })
  @ManyToMany(() => Role)
  roles: Role[];
}
