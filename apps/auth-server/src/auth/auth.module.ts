import { DynamicModule, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { SmsModule } from "../sms/sms.module";
import { AuthGuard } from "./auth.guard";
import { APP_GUARD } from "@nestjs/core";
import { UsersModule } from "../users/users.module";
import { MailModule } from "@snlacks/gmail";
import { TokenModule } from "@snlacks/token";
import { Provider } from "@nestjs/common/interfaces";
import { checkEnv } from "../checkEnv";

type SendProps = {
  text: string;
  subject: string;
  html: string;
  to: string;
  from?: string;
};
type Sender<T = any> = (props: SendProps) => Promise<T>;

export const SNL_AUTH_MAILER_KEY = "SNL_AUTH_MAILER_KEY";

@Module({
  imports: [UsersModule, SmsModule, TokenModule, MailModule],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {
  static register(sendService: Provider<{ send: Sender }>): DynamicModule {
    checkEnv("JWT_SECRET");
    checkEnv("JWT_EXPIRES");
    checkEnv("AUTH_DOMAIN");
    return {
      module: AuthModule,
      providers: [sendService],
    };
  }
}
