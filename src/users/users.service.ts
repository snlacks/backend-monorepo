import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  async findAll(): Promise<User[] | undefined> {
    return this.usersRepository.find();
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ username });
  }

  async add(user: CreateUserDTO): Promise<User> {
    const { username } = user;

    if (await this.usersRepository.findOneBy({ username })) {
      throw new HttpException(
        'Conflict, must use a unique username',
        HttpStatus.CONFLICT,
      );
    }

    try {
      await this.usersRepository.insert(user);
    } catch (error) {
      throw new HttpException('Unknown', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return this.usersRepository.findOneBy({ username });
  }
}
