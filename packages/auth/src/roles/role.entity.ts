import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { IRole } from '../../types';
import { User } from '../users/user.entity';
import { ROLE } from './roles';

@Entity()
export class Role extends IRole {
  @PrimaryColumn({ unique: true })
  @IsNotEmpty()
  role_id: ROLE;

  @IsNotEmpty()
  @Column({ unique: true })
  role_name: string;

  @ManyToMany(() => User, (user) => user.roles)
  @JoinTable()
  user: User;
}
