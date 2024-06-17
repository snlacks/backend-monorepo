import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SmsModule } from './sms/sms.module';
import RolesModule from './roles/roles.module';
import AiChatModule from './ai-chat/ai-chat.module';
import MailModule from './mail/mail.module';

const TypeOrmModuleForRoot = TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [],
    synchronize: true,
    autoLoadEntities: true,
  }),
});

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    AiChatModule,
    AuthModule,
    ConfigModule.forRoot(),
    RolesModule,
    SmsModule,
    TypeOrmModuleForRoot,
    MailModule,
  ],
})
export class AppModule {}
