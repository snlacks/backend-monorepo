import { IsNotEmpty, IsEmail, IsPhoneNumber } from 'class-validator';
export class CreateUserDTO {
  @IsEmail()
  @IsNotEmpty()
  username: string;

  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;
}
