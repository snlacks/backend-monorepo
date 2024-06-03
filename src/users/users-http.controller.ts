import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './create-user.dto';
import { Public } from './public.decorator';
import { ROLE } from '../roles/roles';
import { Roles } from '../roles/roles.decorator';

@Controller('users')
export class UsersHTTPController {
  constructor(private usersService: UsersService) {}
  @Get('/')
  @Roles(ROLE.ADMIN)
  getAll() {
    return this.usersService.findAll();
  }

  @Post('/')
  @UsePipes(new ValidationPipe({ transform: true }))
  @Public()
  add(@Body() user: CreateUserDTO) {
    return this.usersService.add(user);
  }
}
