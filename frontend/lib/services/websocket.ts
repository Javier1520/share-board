import { useState, useCallback, useEffect, useRef } from "react";
import { WebSocketMessage, WebSocketTicket } from "@/lib/types";
import { getCookie } from "@/lib/utils";
import api from "./api";
import { config } from "@/lib/config";

export const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectingRef = useRef(false);
  const currentRoomRef = useRef<string | null>(null);

  const getWebSocketTicket = async (roomCode: string) => {
    try {
      const response = await api.post<WebSocketTicket>("/api/ws-ticket");
      return response.data.token;
    } catch (error) {
      throw new Error("Failed to get WebSocket ticket");
    }
  };

  const connect = useCallback(
    async (roomCode: string) => {
      // Skip if already connected to the same room or in process of connecting
      if (
        socket?.readyState === WebSocket.OPEN &&
        currentRoomRef.current === roomCode
      ) {
        return;
      }

      // Skip if already connecting
      if (connectingRef.current) {
        return;
      }

      try {
        connectingRef.current = true;
        setIsConnecting(true);
        setConnectionError(null);

        // Close existing connection if any
        if (socket) {
          socket.close();
          setSocket(null);
        }

        const ticket = await getWebSocketTicket(roomCode);
        const wsUrl = `${config.wsUrl}/ws/room/${roomCode}?token=${ticket}`;

        const ws = new WebSocket(wsUrl);

        ws.addEventListener("open", () => {
          currentRoomRef.current = roomCode;
          setSocket(ws);
          setIsConnecting(false);
          setConnectionError(null);
          connectingRef.current = false;
        });

        ws.addEventListener("error", () => {
          setConnectionError("Connection error occurred");
          setIsConnecting(false);
          connectingRef.current = false;
          currentRoomRef.current = null;
        });

        ws.addEventListener("close", () => {
          setSocket(null);
          setIsConnecting(false);
          connectingRef.current = false;
          currentRoomRef.current = null;
        });
      } catch (error) {
        setConnectionError("Failed to connect");
        setIsConnecting(false);
        connectingRef.current = false;
        currentRoomRef.current = null;
      }
    },
    [socket]
  );

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      currentRoomRef.current = null;
    }
  }, [socket]);

  const sendMessage = useCallback(
    (content: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          action: "message",
          content,
        };
        socket.send(JSON.stringify(message));
      }
    },
    [socket]
  );

  const updateSharedText = useCallback(
    (shared_text: string, save: boolean = false) => {
      if (socket?.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          action: save ? "save_shared_text" : "update_shared_text",
          shared_text,
        };
        socket.send(JSON.stringify(message));
      }
    },
    [socket]
  );

  const updateDrawing = useCallback(
    (drawing_data: string, save: boolean = false) => {
      if (socket?.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          action: save ? "save_drawing" : "update_drawing",
          drawing_data,
        };
        socket.send(JSON.stringify(message));
      }
    },
    [socket]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
        currentRoomRef.current = null;
      }
    };
  }, [socket]);

  return {
    socket,
    connect,
    disconnect,
    isConnecting,
    connectionError,
    sendMessage,
    updateSharedText,
    updateDrawing,
  };
};
