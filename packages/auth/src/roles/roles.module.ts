import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from "./role.entity";
import { RolesService } from "./roles.service";
import { RolesGuard } from "./roles.guard";
import { APP_GUARD } from "@nestjs/core";
import { TokenModule } from "@snlacks/token";
import { User } from "../users/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), TokenModule],
  providers: [RolesService, { provide: APP_GUARD, useClass: RolesGuard }],
  exports: [TypeOrmModule, RolesService],
})
export class RolesModule {}
