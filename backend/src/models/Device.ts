export interface Device {
  id?: number;
  user_id: number;
  name: string;
  serial_number?: string;
  notes?: string;
  last_packed: string;
  reminder_interval: number; // 6, 9, oder 12 Monate
  reminder_enabled: boolean;
  created_at?: string;
  last_reminder?: string;
}

export interface DeviceWithUser extends Device {
  user_email?: string;
  user_vorname?: string;
  user_name?: string;
  user_is_active?: boolean;
}