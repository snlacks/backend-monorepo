import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  username: string;

  @IsNotEmpty()
  password: string;

  remember_me?: boolean;
}
