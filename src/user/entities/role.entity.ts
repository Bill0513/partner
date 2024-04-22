import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permission } from './permission.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn({
    comment: 'id',
  })
  id: number;

  @Column({
    comment: '角色名',
    type: 'varchar',
    length: 20,
  })
  name: string;

  @JoinTable({
    name: 'role_permission_relations',
  })
  @ManyToMany(() => Permission)
  permissions: Permission[];
}
