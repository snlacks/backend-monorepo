import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GuestKey } from './entities/guest-key.entity';
import { CreateGuestKeyDto } from './dto/create-guest-key.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GuestKeysService {
  constructor(
    @InjectRepository(GuestKey) private repository: Repository<GuestKey>,
  ) {}

  async create(createGuestKeyDto: CreateGuestKeyDto) {
    const result = await this.repository.insert(createGuestKeyDto);
    return result.generatedMaps[0];
  }

  findOne(guest_key_id: string) {
    return (
      process.env.UNIVERSAL_GUEST_KEY ??
      this.repository.findOneBy({ guest_key_id })
    );
  }

  remove(guest_key_id: string) {
    return this.repository.delete({ guest_key_id });
  }
}
