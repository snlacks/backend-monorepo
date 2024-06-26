import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { UsersService } from './users.service';
import { Password } from './password.entity';
import { RolesModule } from '../roles/roles.module';
@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Password]), RolesModule],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
