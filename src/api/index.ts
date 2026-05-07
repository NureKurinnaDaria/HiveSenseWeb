import client from "./client";
import type {
  Alert,
  Measurement,
  HoneyBatch,
  Threshold,
  Sensor,
  AuditLog,
} from "../types";

// --- Alerts ---
export const getAlerts = async (warehouseId?: number): Promise<Alert[]> => {
  const params = warehouseId ? { warehouse_id: warehouseId } : {};
  const res = await client.get<Alert[]>("/alerts", { params });
  return res.data;
};

// --- Measurements ---
export const getMeasurements = async (
  warehouseId?: number,
): Promise<Measurement[]> => {
  const params = warehouseId ? { warehouse_id: warehouseId } : {};
  const res = await client.get<Measurement[]>("/measurements", { params });
  return res.data;
};

// --- Honey Batches ---
export const getHoneyBatches = async (
  warehouseId?: number,
): Promise<HoneyBatch[]> => {
  const url = warehouseId
    ? `/honey-batches?warehouse_id=${warehouseId}`
    : "/honey-batches";
  const res = await client.get<HoneyBatch[]>(url);
  return res.data;
};

export const createHoneyBatch = async (
  data: Omit<HoneyBatch, "batch_id">,
): Promise<HoneyBatch> => {
  const res = await client.post<HoneyBatch>("/honey-batches", data);
  return res.data;
};

export const updateHoneyBatch = async (
  id: number,
  data: Partial<HoneyBatch>,
): Promise<HoneyBatch> => {
  const res = await client.put<HoneyBatch>(`/honey-batches/${id}`, data);
  return res.data;
};

export const deleteHoneyBatch = async (id: number): Promise<void> => {
  await client.delete(`/honey-batches/${id}`);
};

// --- Sensors ---
export const getAllSensors = async (): Promise<Sensor[]> => {
  const res = await client.get<Sensor[]>("/sensors");
  return res.data;
};

export const createSensor = async (
  data: Omit<Sensor, "sensor_id">,
): Promise<Sensor> => {
  const res = await client.post<Sensor>("/sensors", data);
  return res.data;
};

export const updateSensor = async (
  id: number,
  data: Partial<Sensor>,
): Promise<Sensor> => {
  const res = await client.put<Sensor>(`/sensors/${id}`, data);
  return res.data;
};

export const deleteSensor = async (id: number): Promise<void> => {
  await client.delete(`/sensors/${id}`);
};

// --- Thresholds ---
export const getAllThresholds = async (): Promise<Threshold[]> => {
  const res = await client.get<Threshold[]>("/thresholds");
  return res.data;
};

export const getThresholdByWarehouse = async (
  warehouseId: number,
): Promise<Threshold> => {
  const res = await client.get<Threshold>(
    `/thresholds/warehouse/${warehouseId}`,
  );
  return res.data;
};

export const createThreshold = async (
  data: Omit<Threshold, "threshold_id">,
): Promise<Threshold> => {
  const res = await client.post<Threshold>("/thresholds", data);
  return res.data;
};

export const updateThreshold = async (
  warehouseId: number,
  data: Partial<Threshold>,
): Promise<Threshold> => {
  const res = await client.put<Threshold>(
    `/thresholds/warehouse/${warehouseId}`,
    data,
  );
  return res.data;
};

export const deleteThreshold = async (warehouseId: number): Promise<void> => {
  await client.delete(`/thresholds/warehouse/${warehouseId}`);
};

// --- Audit ---
export const getAuditLogs = async (params?: {
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
}): Promise<AuditLog[]> => {
  const res = await client.get<AuditLog[]>("/audit", { params });
  return res.data;
};

// --- Reports ---
export const getWarehouseSummary = async (warehouseId: number) => {
  const res = await client.get(`/reports/warehouse/${warehouseId}/summary`);
  return res.data;
};
