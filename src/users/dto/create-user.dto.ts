import { IsNotEmpty, IsEmail, IsPhoneNumber } from 'class-validator';
export class CreateUserDTO {
  @IsEmail()
  @IsNotEmpty()
  username: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  phone_number: string;

  @IsNotEmpty()
  guest_key_id: string;
}
