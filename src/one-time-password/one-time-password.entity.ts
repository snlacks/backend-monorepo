import { IsNotEmpty } from 'class-validator';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity()
export class OneTimePassword {
  @PrimaryColumn()
  @Index({ unique: true })
  @IsNotEmpty()
  username: string;

  @Column()
  @IsNotEmpty()
  hash: string;

  @Column()
  @IsNotEmpty()
  salt: string;

  @Column({ type: 'timestamp' }) // Recommended
  expiration: Date;
}
