import client from "./client";
import type { LoginResponse } from "../types";

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const res = await client.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
  return res.data;
};
