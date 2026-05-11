import client from "./client";
import type { User } from "../types";

type BackendRole = "worker" | "admin" | "owner";
type FrontendRole = "EMPLOYEE" | "ADMIN" | "OWNER";

export const toBackendRole = (role: string): BackendRole => {
  const map: Record<string, BackendRole> = {
    EMPLOYEE: "worker",
    ADMIN: "admin",
    OWNER: "owner",
    worker: "worker",
    admin: "admin",
    owner: "owner",
  };
  return map[role] ?? "worker";
};

export const toFrontendRole = (role: string): FrontendRole => {
  const map: Record<string, FrontendRole> = {
    worker: "EMPLOYEE",
    admin: "ADMIN",
    owner: "OWNER",
    EMPLOYEE: "EMPLOYEE",
    ADMIN: "ADMIN",
    OWNER: "OWNER",
  };
  return map[role] ?? "EMPLOYEE";
};

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
  name: string;
  role: string;
  is_active: boolean;
  warehouse_id?: number;
}): Promise<User> => {
  const res = await client.post<User>("/users", {
    ...data,
    role: toBackendRole(data.role),
  });
  return res.data;
};

export const updateUser = async (
  id: number,
  data: {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    is_active?: boolean;
    warehouse_id?: number | null;
  },
): Promise<User> => {
  const res = await client.put<User>(`/users/${id}`, {
    ...data,
    ...(data.role ? { role: toBackendRole(data.role) } : {}),
  });
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
