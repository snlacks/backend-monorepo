import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get('/')
  getAll() {
    return this.usersService.findAll();
  }

  @Post('/')
  @UsePipes(new ValidationPipe({ transform: true }))
  add(@Body() user: User) {
    return this.usersService.add(user);
  }
}
