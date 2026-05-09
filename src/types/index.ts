export interface User {
  id?: number;
  user_id: number;
  email: string;
  full_name: string;
  role: "ADMIN" | "OWNER" | "EMPLOYEE";
  is_active: boolean;
  warehouse_id: number | null;
  warehouse?: Warehouse;
}

export interface Warehouse {
  warehouse_id: number;
  name: string;
  location: string;
  status: "ACTIVE" | "INACTIVE";
  sensors?: Sensor[];
  honey_batches?: HoneyBatch[];
  alerts?: Alert[];
  threshold?: Threshold;
}

export interface Sensor {
  sensor_id: number;
  serial_number: string;
  type: string;
  is_active: boolean;
  warehouse_id: number;
}

export interface Measurement {
  measurement_id: number;
  temperature_c: string;
  humidity_percent: string;
  measured_at: string;
  sensor_id: number;
  sensor?: Sensor;
}

export interface Alert {
  alert_id: number;
  type: "TEMP_HIGH" | "TEMP_LOW" | "HUMIDITY_HIGH" | "HUMIDITY_LOW";
  status: "NEW" | "ACKNOWLEDGED" | "RESOLVED";
  created_at: string;
  resolved_at: string | null;
  warehouse_id: number;
  sensor_id: number | null;
  user_id: number | null;
}

export interface HoneyBatch {
  batch_id: number;
  variety: string;
  quantity_kg: number;
  received_date: string;
  expiration_date: string;
  status: "ACTIVE" | "EXPIRED" | "SOLD";
  warehouse_id: number;
}

export interface Threshold {
  threshold_id: number;
  warehouse_id: number;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
}

export interface AuditLog {
  id: number;
  entity: string;
  action: string;
  actor_user_id: number;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}
