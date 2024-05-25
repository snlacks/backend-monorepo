import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersHTTPModule } from '../users/usershttp.module';
import { OneTimePasswordModule } from '../one-time-password/one-time-password.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [UsersHTTPModule, OneTimePasswordModule, SmsModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
