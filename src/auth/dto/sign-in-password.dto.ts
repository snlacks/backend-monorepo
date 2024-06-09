import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInPasswordOnlyDto {
  @IsNotEmpty()
  @IsEmail()
  username: string;

  @IsNotEmpty()
  password: string;
}
