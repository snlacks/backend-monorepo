import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { UsersService } from './users.service';
import { GuestKeysModule } from '../guest-keys/guest-keys.module';
import { Password } from './password.entity';
@Module({
  imports: [GuestKeysModule, TypeOrmModule.forFeature([User, Role, Password])],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
