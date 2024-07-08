import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { Role } from '../roles/role.entity';
import { addYears, formatISO } from 'date-fns';
import { Password } from './password.entity';
import { UpdatePasswordDTO } from './dto/update-password-dto';
import { ROLE } from '../roles/roles';
import { IUser } from '../../types';
import { UserRoleRelationship } from '../roles/user_role.entity';

export const hashPassword = (password: string, salt) =>
  new Promise<string>((resolve, reject) =>
    crypto.pbkdf2(password, salt, 1000, 64, `sha512`, (err, h) => {
      if (err) {
        reject(err);
      }
      resolve(h.toString('hex'));
    }),
  );
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Password)
    private passwordRepository: Repository<Password>,
    @InjectRepository(UserRoleRelationship)
    private userRoleRepository: Repository<UserRoleRelationship>,
  ) {}

  async findAll(): Promise<User[] | undefined> {
    return this.usersRepository.find();
  }

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ username });
  }

  async findPass(user_id: string) {
    return this.passwordRepository.findOneBy({ user_id });
  }
  async changePassword({
    username,
    old_password,
    new_password,
  }: UpdatePasswordDTO) {
    const { user_id } = await this.usersRepository.findOneBy({
      username,
    });
    const entry = await this.passwordRepository.findOneBy({ user_id });
    const oldHash = await hashPassword(old_password, entry.salt);

    if (oldHash !== entry.hash) {
      throw new UnauthorizedException();
    }
    await this.updatePassword(user_id, new_password);
  }

  async updatePassword(userId: string, newPassword: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await hashPassword(newPassword, salt);
    return await this.passwordRepository.update(
      {
        user_id: userId,
      },
      {
        hash,
        salt,
        expiration: formatISO(addYears(new Date(), 2)),
      },
    );
  }

  async add(user: CreateUserDTO): Promise<IUser> {
    const { username } = user;
    const existingUser = await this.usersRepository.findOneBy({ username });
    if (existingUser) {
      throw new HttpException(
        "We can't verify that email, it might be invalid or already registered.",
        HttpStatus.CONFLICT,
      );
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = await hashPassword(user.password, salt);
    const pDTO = {
      hash,
      salt,
      expiration: formatISO(addYears(new Date(), 2)),
    };
    const newUser = this.usersRepository.create({
      ...user,
      roles: [{ ...new Role(), role_id: ROLE.USER }],
    });
    // if (!newPass) {
    //   throw new Error('Password error');
    // }
    const result = await this.usersRepository.save(newUser);
    await this.passwordRepository.insert({
      ...pDTO,
      user_id: result.user_id,
    });
    return result;
  }

  async remove(user_id: string) {
    await this.usersRepository.delete({ user_id });
    await this.passwordRepository.delete({ user_id });
  }

  async addUserRole(user_id: string, role_id: ROLE) {
    const user = await this.usersRepository.findOne({
      where: { user_id },
      relations: ['roles'],
    });

    if (!user) {
      return;
    }
    await this.userRoleRepository.upsert({ user_id, role_id }, [
      'user_id',
      'role_id',
    ]);
  }
  async removeUserRole(user_id: string, role_id: ROLE) {
    const user = await this.usersRepository.findOne({
      where: { user_id },
      relations: ['roles'],
    });

    if (!user) {
      return;
    }
    await this.userRoleRepository
      .createQueryBuilder()
      .where('user_id = :user_id AND role_id = :role_id', { user_id, role_id })
      .delete()
      .execute();
  }
}
