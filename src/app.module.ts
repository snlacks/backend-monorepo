import { ConsoleLogger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersHTTPModule } from './users/usershttp.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SmsModule } from './sms/sms.module';

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
  providers: [AppService, ConsoleLogger],
  imports: [
    AuthModule,
    UsersHTTPModule,
    UsersHTTPModule,
    ConfigModule.forRoot(),
    SmsModule,
    TypeOrmModuleForRoot,
  ],
})
export class AppModule {}
