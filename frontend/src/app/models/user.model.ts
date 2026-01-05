export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;   // ← Frontend-Formular
  last_name: string;    // ← Frontend-Formular
}

export interface LoginRequest {
  email: string;
  password: string;
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