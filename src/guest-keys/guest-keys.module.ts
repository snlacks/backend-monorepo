import { Module } from '@nestjs/common';
import { GuestKeysService } from './guest-keys.service';
import { GuestKeysController } from './guest-keys.controller';
import { GuestKey } from './entities/guest-key.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import RolesModule from '../roles/roles.module';
import TokenModule from '../token/token.module';

@Module({
  imports: [TypeOrmModule.forFeature([GuestKey]), TokenModule, RolesModule],
  controllers: [GuestKeysController],
  providers: [GuestKeysService],
  exports: [TypeOrmModule, GuestKeysService],
})
export class GuestKeysModule {}
