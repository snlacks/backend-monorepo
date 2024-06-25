import { Entity } from 'typeorm';
export enum ROLE {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
@Entity({ name: 'user_role' })
export class UserRoleRelationship {}
