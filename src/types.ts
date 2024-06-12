import { Role } from './roles/role.entity';

export interface UserResponse {
  user_id: string;
  username: string;
  phone_number: string;
  roles: Role[];
}
