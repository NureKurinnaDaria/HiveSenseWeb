import client from "./client";
import type { Warehouse } from "../types";

export const getAllWarehouses = async (): Promise<Warehouse[]> => {
  const res = await client.get<Warehouse[]>("/warehouses");
  return res.data;
};

export const getWarehouse = async (id: number): Promise<Warehouse> => {
  const res = await client.get<Warehouse>(`/warehouses/${id}`);
  return res.data;
};

export const createWarehouse = async (data: {
  name: string;
  location: string;
  status: string;
}): Promise<Warehouse> => {
  const res = await client.post<Warehouse>("/warehouses", data);
  return res.data;
};

export const updateWarehouse = async (
  id: number,
  data: Partial<Warehouse>,
): Promise<Warehouse> => {
  const res = await client.put<Warehouse>(`/warehouses/${id}`, data);
  return res.data;
};

export const deleteWarehouse = async (id: number): Promise<void> => {
  await client.delete(`/warehouses/${id}`);
};
