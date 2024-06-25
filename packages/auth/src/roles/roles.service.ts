import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { roles } from './roles';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
  ) {}
  async seedRoles() {
    for (const role of roles) {
      await this.roleRepository.upsert(role, RolesService.UPSERT_CONFIG);
    }
  }
  static UPSERT_CONFIG = {
    conflictPaths: ['role_id'],
    skipUpdateIfNoValuesChanged: true,
  };
}
