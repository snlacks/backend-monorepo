import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/user.entity";
import { Role } from "./role.entity";
import RolesService from "./roles.service";
import { RolesGuard } from "./roles.guard";
import { APP_GUARD } from "@nestjs/core";
import { TokenModule } from "@snlacks/token";

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), TokenModule],
  providers: [RolesService, { provide: APP_GUARD, useClass: RolesGuard }],
  exports: [TypeOrmModule, RolesService],
})
export default class RolesModule {}
