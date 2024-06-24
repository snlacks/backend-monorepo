import { DynamicModule } from "@nestjs/common";
import {
  AuthService,
  SNL_AUTH_MAILER_KEY,
  SNL_AUTH_SMS_KEY,
} from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { APP_GUARD } from "@nestjs/core";
import { UsersModule } from "../users/users.module";
import { TokenModule } from "@snlacks/token";
import { ISendService, ISmsService } from "../../types";

export class AuthModule {
  static register(
    SendService: typeof ISendService,
    TextService: typeof ISmsService
  ): DynamicModule {
    return {
      module: AuthModule,
      imports: [UsersModule, TokenModule],
      providers: [
        AuthService,
        { provide: SNL_AUTH_MAILER_KEY, useFactory: () => new SendService() },
        { provide: SNL_AUTH_SMS_KEY, useFactory: () => new TextService() },
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
      controllers: [AuthController],
    };
  }
}
