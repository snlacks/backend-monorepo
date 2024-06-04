import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GuestKeysService } from './guest-keys.service';
import { Roles } from '../roles/roles.decorator';
import { ROLE } from '../roles/roles';
import { RolesGuard } from '../roles/roles.guard';
import { CreateGuestKeyDto } from './dto/create-guest-key.dto';

@Roles(ROLE.ADMIN)
@UseGuards(RolesGuard)
@Controller('guest-keys')
export class GuestKeysController {
  constructor(private readonly guestKeysService: GuestKeysService) {}

  @Post()
  create(@Body() createGuestKeyDto: CreateGuestKeyDto) {
    return this.guestKeysService.create({ email: createGuestKeyDto.email });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.guestKeysService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guestKeysService.remove(id);
  }
}
