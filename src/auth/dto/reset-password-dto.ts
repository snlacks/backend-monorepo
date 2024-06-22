import { IsNotEmpty } from 'class-validator';

export class ResetPasswordDTO {
  @IsNotEmpty()
  username: string;
  @IsNotEmpty()
  one_time_password: string;
  @IsNotEmpty()
  new_password: string;
}
