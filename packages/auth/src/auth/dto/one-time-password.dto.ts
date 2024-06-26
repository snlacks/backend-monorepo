import { IsNotEmpty } from 'class-validator';

export class RequestOTPDTO {
  @IsNotEmpty()
  username: string;
  phone_number?: string;
  method?: 'sms' | 'email';
}
