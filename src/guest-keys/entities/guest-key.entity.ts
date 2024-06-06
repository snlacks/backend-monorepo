import { IsEmail } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class GuestKey {
  @PrimaryGeneratedColumn('uuid')
  guest_key_id: string;

  @Column({ nullable: true })
  @IsEmail()
  email?: string;
}
