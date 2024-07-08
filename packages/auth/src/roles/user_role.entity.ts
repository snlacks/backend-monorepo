import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
export enum ROLE {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
@Entity({ name: 'user_role' })
@Index(['role_id', 'user_id'], { unique: true })
export class UserRoleRelationship {
  @PrimaryColumn({ unique: false })
  user_id: string;

  @Column()
  role_id: ROLE;
}
