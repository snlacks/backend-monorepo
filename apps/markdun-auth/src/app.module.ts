import { Module } from '@nestjs/common';
import { AuthModule } from '@snlacks/core/auth';
import { checkEnv } from '@snlacks/core/utils';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SendService } from './send.service';
import { AppController } from './app.controller';

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
      protocol: process.env.PROTOCOL,
      entities: [],
      autoLoadEntities: true,
    };
  },
});
@Module({
  imports: [
    TypeOrmModuleForRoot,
    AuthModule.register(SendService, SendService),
    ConfigModule.forRoot(),
  ],
  controllers: [AppController],
})
export class AppModule {}
