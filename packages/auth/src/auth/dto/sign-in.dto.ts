import { IsNotEmpty, Length } from 'class-validator';

export class SignInDTO {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @Length(6, 6)
  one_time_password: string;

  remember_me?: boolean;
}
