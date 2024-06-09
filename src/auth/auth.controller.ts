import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UseGuards,
  Get,
  UsePipes,
  ValidationPipe,
  Put,
  UnauthorizedException,
  Param,
  Delete,
  Logger,
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
import { UpdatePasswordDTO } from '../users/dto/update-password-dto';
import { SignInPasswordOnlyDto } from './dto/sign-in-password.dto';
import { UserResponse } from '../users/types';
import { SmsResponse } from './types';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  logger = new Logger();

  @Get('/users')
  @Roles(ROLE.ADMIN)
  getUsers() {
    return this.usersService.findAll();
  }

  @Post('/users')
  @UsePipes(new ValidationPipe({ transform: true }))
  @Public()
  async addUser(@Body() user: CreateUserDTO, @Res() res: Response) {
    const newUser = await this.usersService.add(user);
    res.status(201);
    res.send(newUser);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/request-otp')
  async requestOTP(@Body() requestOTPDTO: RequestOTPDTO, @Res() res: Response) {
    try {
      const otpResponse = await this.authService.requestOTP(requestOTPDTO);
      if ((otpResponse as User)?.user_id) {
        await AuthGuard.setAuthorizationCookie(
          otpResponse as User,
          res,
          this.jwtService,
        );
      }
      res.status(201);
      res.send(
        otpResponse.hasOwnProperty('oneTimePassword') ? otpResponse : null,
      );
    } catch (e) {
      this.logger.log(e);
      throw new UnauthorizedException();
    }
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: SignInDTO, @Res() res: Response) {
    const { user, token } = await this.authService.verifyOTP(
      signInDto.username,
      signInDto.one_time_password,
    );
    res.cookie(
      AuthGuard.AUTHORIZATION_COOKIE_NAME,
      AuthGuard.wrapCookie(token),
      {
        sameSite: 'strict',
        httpOnly: true,
      },
    );

    res.send(user);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login-password')
  async loginPassword(
    @Body() signInDto: SignInPasswordOnlyDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let user: UserResponse | SmsResponse;
    try {
      const { data: knownDevice } = await this.jwtService.verifyAsync(
        req.cookies[AuthGuard.DEVICE_COOKIE_NAME],
        {
          secret: process.env.JWT_SECRET,
        },
      );
      user = await this.authService.loginPasswordOnly(signInDto, knownDevice);
    } catch (e) {
      user = await this.authService.loginPasswordOnly(signInDto);
    }
    if (!user) {
      throw new UnauthorizedException();
    }
    if ((user as UserResponse)?.user_id) {
      res.status(200);
      res.cookie(
        AuthGuard.AUTHORIZATION_COOKIE_NAME,
        AuthGuard.wrapCookie(
          await AuthGuard.getSignerPayload(
            user as UserResponse,
            this.jwtService,
          ),
        ),
        {
          sameSite: 'strict',
          httpOnly: true,
        },
      );
    }

    return res.send(user);
  }

  @Put('/users/password')
  @Roles(ROLE.ADMIN)
  updatePassword(dto: UpdatePasswordDTO) {
    return this.usersService.updatePassword(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ForDevOnly()
  @UseGuards(ForDevOnlyGuard)
  @Post('/dev-token')
  async devToken(@Body() user: User, @Res() res: Response) {
    res.send(
      await AuthGuard.setAuthorizationCookie(user, res, this.jwtService),
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    res.send(req['user']);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/sign-out')
  async signOut(@Res() res: Response) {
    res.clearCookie(AuthGuard.AUTHORIZATION_COOKIE_NAME);
    res.send();
  }

  @Roles(ROLE.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Delete('/users/:id')
  async removeUser(@Param() params: { id: string }, @Res() res: Response) {
    await this.usersService.remove(params.id);
    res.status(204);
    res.send();
  }
}
