import { Role } from './role.model';

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  role?: Role;
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  role_id?: string;
}

