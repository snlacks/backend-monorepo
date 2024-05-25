import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO } from './sign-in.dto';
import { RequestOTPDTO } from '../one-time-password/one-time-password.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('request-otp')
  requestOTP(@Body() requestOTPDTO: RequestOTPDTO) {
    return this.authService.requestOTP(requestOTPDTO.username);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: SignInDTO, @Res() res: Response) {
    const token = await this.authService.signIn(
      signInDto.username,
      signInDto.oneTimePassword,
    );

    res.cookie('Authenticate', token, {
      sameSite: 'strict',
      httpOnly: true,
    });

    res.send({ success: true });
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verify(@Req() req: Request, @Res() res: Response) {
    const verified = this.authService.verifyToken(req.cookies['Authenticate']);

    res.cookie('Authenticate', this.authService.signToken(verified.data), {
      sameSite: 'strict',
      httpOnly: true,
    });
    res.send({ success: true });
  }
}
