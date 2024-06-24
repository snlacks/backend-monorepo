import { Module } from "@nestjs/common";
import { SendService } from "./send.service";
import { ConnectService } from "./connect.service";
import { MailController } from "./mail.controller";

@Module({
  providers: [SendService, ConnectService],
  controllers: [MailController],
  exports: [SendService],
})
export class MailModule {}
