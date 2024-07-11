import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { formatISO } from 'date-fns';
@Entity()
export class Attempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    type: 'timestamp',
  })
  time: string;

  @ManyToOne(() => User, (user) => user.username)
  @JoinColumn({
    name: 'username',
  })
  username: string;
}
