import { auth } from "./auth";

interface Room {
  code: string;
  participants: {
    id: string;
    username: string;
  }[];
}

interface Drawing {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
}

interface Message {
  id: number;
  content: string;
  user: {
    id: string;
    username: string;
  };
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = auth.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    console.log(`Making API request to: ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
      });
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
};

export const rooms = {
  create: async (): Promise<Room> => {
    console.log("Creating new room...");
    const room = await fetchApi("/rooms/", { method: "POST" });
    console.log("Room created:", room);
    return room;
  },

  get: async (code: string): Promise<Room> => {
    console.log(`Fetching room with code: ${code}`);
    const room = await fetchApi(`/rooms/${code}/`);
    console.log("Room fetched:", room);
    return room;
  },

  join: async (code: string): Promise<void> => {
    return fetchApi(`/rooms/${code}/join/`, { method: "POST" });
  },

  leave: async (code: string): Promise<void> => {
    return fetchApi(`/rooms/${code}/leave/`, { method: "POST" });
  },

  sendMessage: async (code: string, content: string): Promise<void> => {
    return fetchApi(`/rooms/${code}/messages/`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  getMessages: async (code: string): Promise<Message[]> => {
    return fetchApi(`/rooms/${code}/messages/`);
  },

  saveDrawing: async (code: string, drawing: Drawing): Promise<void> => {
    return fetchApi(`/rooms/${code}/drawings/`, {
      method: "POST",
      body: JSON.stringify(drawing),
    });
  },

  getDrawings: async (code: string): Promise<Drawing[]> => {
    return fetchApi(`/rooms/${code}/drawings/`);
  },
};
