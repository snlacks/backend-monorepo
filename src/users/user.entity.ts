import { IsEmail, IsNotEmpty, IsPhoneNumber } from 'class-validator';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Role } from '../roles/role.entity';
import { UserResponse } from '../types';

@Entity()
export class User implements UserResponse {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ unique: true })
  @Index()
  @IsEmail()
  @IsNotEmpty()
  username: string;

  @Column()
  @IsPhoneNumber()
  phone_number: string;

  @ManyToMany(() => Role, (role) => role.role_id, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'user_role',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'user_id',
      foreignKeyConstraintName: 'user_role_user_id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'role_id',
      foreignKeyConstraintName: 'user_role_role_id',
    },
  })
  @IsNotEmpty()
  roles: Role[];
}
