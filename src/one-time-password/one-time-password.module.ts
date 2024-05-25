import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OneTimePassword } from './one-time-password.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OneTimePassword])],
  exports: [TypeOrmModule],
})
export class OneTimePasswordModule {}
