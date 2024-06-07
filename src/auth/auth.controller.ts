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
  Get,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDTO } from './dto/sign-in.dto';
import { RequestOTPDTO } from '../one-time-password/dto/one-time-password.dto';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { Public } from '../users/public.decorator';
import { User } from '../users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ForDevOnly } from './for-dev-only.decorator';
import { ForDevOnlyGuard } from './for-dev-only.guard';
import { UsersService } from '../users/users.service';
import { Roles } from '../roles/roles.decorator';
import { ROLE } from '../roles/roles';
import { CreateUserDTO } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  @Get('/users')
  @Roles(ROLE.ADMIN)
  getUsers() {
    return this.usersService.findAll();
  }

  @Post('/users')
  @UsePipes(new ValidationPipe({ transform: true }))
  @Public()
  addUser(@Body() user: CreateUserDTO) {
    return this.usersService.add(user);
  }

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
      signInDto.one_time_password,
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
    res.send(await AuthGuard.setCookie(user, res, this.jwtService));
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    res.send(req['user']);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('sign-out')
  async signOut(@Res() res: Response) {
    res.clearCookie('Authorization');
    // res.cookie('Authorization', '', { maxAge: 0, expires: new Date() });
    res.send();
  }
}
