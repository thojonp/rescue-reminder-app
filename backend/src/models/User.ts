export interface User {
  id?: number;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface UserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface UserWithDeviceCount extends UserResponse {
  device_count: number;
  created_at: string;
}