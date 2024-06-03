import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersHTTPController } from './users-http.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [JwtModule, UsersModule, AuthModule],
  controllers: [UsersHTTPController],
  exports: [],
})
export class UsersHTTPModule {}
