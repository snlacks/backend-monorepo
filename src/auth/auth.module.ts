import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OneTimePasswordModule } from '../one-time-password/one-time-password.module';
import { SmsModule } from '../sms/sms.module';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import TokenModule from '../token/token.module';

@Module({
  imports: [UsersModule, OneTimePasswordModule, SmsModule, TokenModule],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
