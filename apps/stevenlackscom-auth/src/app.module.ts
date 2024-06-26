import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MailModule, SendService } from '@snlacks/core/gmail';
import { AiChatModule } from '@snlacks/core/ai-chat';
import { AuthModule, RolesModule } from '@snlacks/core/auth';
import { SmsService } from '@snlacks/core/twilio';
import { checkEnv } from './checkEnv';

const TypeOrmModuleForRoot = TypeOrmModule.forRootAsync({
  useFactory: () => {
    ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'].forEach(
      (el) => {
        checkEnv(el);
      },
    );
    return {
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [],
      autoLoadEntities: true,
    };
  },
});

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    AiChatModule,
    AuthModule.register(SendService, SmsService),
    ConfigModule.forRoot(),
    RolesModule,
    TypeOrmModuleForRoot,
    MailModule,
  ],
})
export class AppModule {}
