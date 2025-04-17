export interface User {
  username: string;
  email?: string;
}

export interface Message {
  id?: number;
  content: string;
  sender: User;
  room_code?: string;
  created_at?: string;
}

export interface Room {
  id: number;
  code: string;
  created_at: string;
  updated_at: string;
  drawing_data?: string;
  shared_text?: string;
  messages: Message[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  email?: string;
}

export interface AuthError {
  field?: string;
  message: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  username: string;
  email?: string;
}

export interface TokenRefreshResponse {
  access: string;
}

export interface CreateMessageRequest {
  room: string;
  content: string;
}

export interface WebSocketMessage {
  action: 'message' | 'update_shared_text' | 'save_shared_text' | 'update_drawing' | 'save_drawing';
  content?: string;
  shared_text?: string;
  drawing_data?: string;
}

export interface WebSocketResponse {
  type: 'chat.message';
  action?: 'update_shared_text' | 'update_drawing';
  sender?: User;
  content?: string;
  shared_text?: string;
  drawing_data?: string;
}

export interface WebSocketTicket {
  token: string;
}

export type WebSocketCloseCode = 4001 | 4002 | 4003;

export interface WebSocketError extends Error {
  code?: WebSocketCloseCode;
}
