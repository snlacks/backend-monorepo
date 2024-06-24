import { DynamicModule, Module } from "@nestjs/common";
import { SendService } from "./send.service";
import { MailController } from "./mail.controller";

@Module({
  providers: [SendService],
  controllers: [MailController],
  exports: [SendService],
})
export class MailModule {}
