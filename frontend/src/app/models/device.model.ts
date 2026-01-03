export interface Device {
  id?: number;
  user_id?: number;
  device_name: string;
  serial_number?: string;
  notes?: string;
  last_packed: string;
  reminder_interval: number; // 6, 9, oder 12 Monate
  reminder_enabled: boolean;
  created_at?: string;
  first_reminder_sent?: string;
  second_reminder_sent?: string;
}

export interface DeviceWithUser extends Device {
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_is_active?: boolean;
}

export interface DeviceFormData {
  name: string;
  serial_number?: string;
  notes?: string;
  last_packed: string;
  reminder_interval: number;
  reminder_enabled: boolean;
}