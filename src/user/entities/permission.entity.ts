import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn({
    comment: 'id',
  })
  id: number;

  @Column({
    comment: '权限代码',
    type: 'varchar',
    length: 20,
  })
  code: string;

  @Column({
    comment: '权限描述',
    type: 'varchar',
    length: 100,
  })
  description: string;
}
