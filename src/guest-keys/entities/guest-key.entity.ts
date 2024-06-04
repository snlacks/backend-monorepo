import { IsEmail } from 'class-validator';
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class GuestKey {
  @PrimaryGeneratedColumn('uuid')
  guest_key_id: string;

  @IsEmail()
  email?: string;
}
