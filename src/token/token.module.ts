import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import TokenService from './token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRES },
      }),
    }),
  ],
  providers: [TokenService],
  exports: [JwtModule, TokenService],
})
export default class TokenModule {}
