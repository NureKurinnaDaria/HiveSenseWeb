import client from "./client";
import type { User } from "../types";

export const getMe = async (): Promise<User> => {
  const res = await client.get<User>("/users/me");
  return res.data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const res = await client.get<User[]>("/users");
  return res.data;
};

export const createUser = async (data: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  warehouse_id?: number | null;
}): Promise<User> => {
  const res = await client.post<User>("/users", data);
  return res.data;
};

export const updateUser = async (
  id: number,
  data: Partial<User> & { password?: string },
): Promise<User> => {
  const res = await client.put<User>(`/users/${id}`, data);
  return res.data;
};

export const blockUser = async (id: number): Promise<void> => {
  await client.patch(`/users/${id}/block`);
};

export const unblockUser = async (id: number): Promise<void> => {
  await client.patch(`/users/${id}/unblock`);
};

export const deleteUser = async (id: number): Promise<void> => {
  await client.delete(`/users/${id}`);
};
