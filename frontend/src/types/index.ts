export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Room {
  id: number;
  code: string;
  host: User;
  participants: User[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  room: number;
  sender: User;
  content: string;
  created_at: string;
}

export interface Drawing {
  id: number;
  room: number;
  user: User;
  data: DrawingData;
  created_at: string;
}

export interface DrawingData {
  type: "draw";
  points: Array<{
    x: number;
    y: number;
    color: string;
    width: number;
  }>;
  timestamp: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export type WebSocketMessageData = DrawingData | null;

export interface WebSocketMessage {
  type: "user_join" | "user_leave" | "chat" | "draw";
  data?: WebSocketMessageData;
  user?: User;
  message?: string;
  username?: string;
}
