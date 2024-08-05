import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Site {
  @PrimaryGeneratedColumn({
    comment: '网站id',
  })
  id: number;

  @Column({
    comment: 'title',
    length: 50,
  })
  title: string;

  @Column({
    comment: 'desc',
    length: 255,
  })
  desc: string;

  @Column({
    comment: 'url',
    length: 255,
  })
  url: string;

  @Column({
    comment: 'userId',
  })
  userId: number;

  @CreateDateColumn({
    comment: '创建时间',
  })
  createTime: Date;

  @UpdateDateColumn({
    comment: '更新时间',
  })
  updateTime: Date;
}
