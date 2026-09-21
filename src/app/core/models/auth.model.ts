import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token?: string;
}

export interface MessageResponse {
  message: string;
  detail?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

