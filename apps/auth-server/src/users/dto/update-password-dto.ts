import { IsNotEmpty } from "class-validator";

export class UpdatePasswordDTO {
  @IsNotEmpty()
  username: string;
  @IsNotEmpty()
  old_password: string;
  @IsNotEmpty()
  new_password: string;
}
