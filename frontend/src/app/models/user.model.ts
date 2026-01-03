export interface User {
  id: number;
  email: string;
  vorname: string;
  name: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  vorname: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface UserWithDeviceCount extends User {
  device_count: number;
  created_at: string;
}