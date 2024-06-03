import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { User } from '../users/user.entity';

@Entity()
export class Role {
  @PrimaryColumn({ unique: true })
  @IsNotEmpty()
  role_id: string;

  @IsNotEmpty()
  @Column({ unique: true })
  role_name: string;

  @ManyToMany(() => User, (user) => user.roles)
  @JoinTable()
  user: User;
}
