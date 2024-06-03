import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Role } from './role.entity';
import RolesService from './roles.service';
import { RolesGuard } from './roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRES },
      }),
    }),
  ],
  providers: [RolesService, { provide: APP_GUARD, useClass: RolesGuard }],
  exports: [TypeOrmModule, RolesService],
})
export default class RolesModule {}
