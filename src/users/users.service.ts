import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { Role } from '../roles/role.entity';
import { GuestKeysService } from '../guest-keys/guest-keys.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private guestKeysService: GuestKeysService,
  ) {}

  async findAll(): Promise<User[] | undefined> {
    return this.usersRepository.find();
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ username });
  }

  async add({ guest_key_id, ...user }: CreateUserDTO): Promise<User> {
    const { username } = user;
    const key = await this.guestKeysService.findOne(guest_key_id);
    if (!key) {
      throw new UnauthorizedException('Invalid invitation');
    }
    const existingUser = await this.usersRepository.findOneBy({ username });
    if (existingUser) {
      throw new HttpException(
        "We can't verify that email, it might be invalid or already registered.",
        HttpStatus.CONFLICT,
      );
    }

    try {
      this.guestKeysService.remove(guest_key_id);

      const newUser = await this.usersRepository.create({
        ...user,
        roles: [{ ...new Role(), role_id: 'USER' }],
      });
      const result = await this.usersRepository.save(newUser);
      return result;
    } catch (error) {
      console.log(error);
      throw new HttpException('Unknown', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
