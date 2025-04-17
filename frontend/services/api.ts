// API service for authentication and room endpoints
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface RegisterPayload {
  username: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

export const register = async (payload: RegisterPayload) => {
  const res = await axios.post(`${API_URL}/api/register`, payload);
  return res.data;
};

export const login = async (payload: LoginPayload): Promise<TokenResponse> => {
  const res = await axios.post(`${API_URL}/api/token`, payload);
  return res.data;
};

export const refreshToken = async (refresh: string): Promise<TokenResponse> => {
  const res = await axios.post(`${API_URL}/api/token/refresh`, { refresh });
  return res.data;
};

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  }
};

export const createRoom = async (access: string) => {
  const res = await axios.post(
    `${API_URL}/api/rooms`,
    {},
    { headers: { Authorization: `Bearer ${access}` } }
  );
  return res.data;
};

export const joinRoom = async (code: string, access: string) => {
  const res = await axios.post(
    `${API_URL}/api/rooms/join`,
    { code },
    { headers: { Authorization: `Bearer ${access}` } }
  );
  return res.data;
};

export const getWebSocketTicket = async (roomCode: string, access: string) => {
  const res = await axios.post(
    `${API_URL}/api/ws-ticket`,
    { room_code: roomCode },
    { headers: { Authorization: `Bearer ${access}` } }
  );
  return res.data;
};
