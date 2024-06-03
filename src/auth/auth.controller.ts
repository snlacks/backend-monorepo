import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO } from './sign-in.dto';
import { RequestOTPDTO } from '../one-time-password/one-time-password.dto';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { Public } from '../users/public.decorator';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ForDevOnly } from './for-dev-only.decorator';
import { ForDevOnlyGuard } from './for-dev-only.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('request-otp')
  async requestOTP(@Body() requestOTPDTO: RequestOTPDTO) {
    try {
      await this.authService.requestOTP(requestOTPDTO);
    } catch {
      throw new UnauthorizedException();
    }
    return;
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() signInDto: SignInDTO, @Res() res: Response) {
    const { user, token } = await this.authService.signIn(
      signInDto.username,
      signInDto.oneTimePassword,
    );

    res.cookie('Authorization', AuthGuard.wrapCookie(token), {
      sameSite: 'strict',
      httpOnly: true,
    });

    res.send(user);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ForDevOnly()
  @UseGuards(ForDevOnlyGuard)
  @Post('dev-token')
  async devToken(@Body() user: User, @Res() res: Response) {
    const token = AuthGuard.wrapCookie(
      await AuthGuard.getSignerPayload(user, this.jwtService),
    );

    res.cookie('Authorization', token, {
      sameSite: 'strict',
      httpOnly: true,
    });

    res.send(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    await AuthGuard.setCookie(req['user'], res, this.jwtService);

    res.send(req['user']);
  }
}
