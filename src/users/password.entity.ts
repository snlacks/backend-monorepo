import { IsNotEmpty } from 'class-validator';
import { Column, Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Password {
  @PrimaryColumn({ name: 'user_id' })
  @IsNotEmpty()
  @OneToOne(() => User, (user) => user.user_id)
  user_id: string;

  @Column()
  @IsNotEmpty()
  hash: string;

  @Column()
  @IsNotEmpty()
  salt: string;

  @Column({ type: 'timestamp' }) // Recommended
  expiration: Date;
}
