// WebSocket (Socket.IO) management for room
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

export interface WebSocketOptions {
  roomCode: string;
  ticket: string;
  onMessage: (data: string) => void;
  onClose?: (code: number, reason: string) => void;
}

export class RoomWebSocket {
  private socket: Socket | null = null;

  connect({ roomCode, ticket, onMessage, onClose }: WebSocketOptions) {
    this.socket = io(`${WS_URL}/ws/room/${roomCode}`, {
      path: `/ws/room/${roomCode}`,
      transports: ["websocket"],
      query: { token: ticket },
      autoConnect: true,
      reconnection: false,
    });
    this.socket.on("connect", () => {});
    this.socket.on("message", onMessage);
    this.socket.on("update_shared_text", onMessage);
    this.socket.on("update_drawing", onMessage);
    this.socket.on("disconnect", (reason: string) => {
      if (onClose) onClose(4000, reason);
    });
    this.socket.on("error", (err: any) => {
      if (onClose) onClose(4000, err.message);
    });
    // Custom close code handling (Socket.IO does not expose close codes directly)
    // Backend should emit a custom event for close codes if needed
  }

  send(event: string, data: string) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
