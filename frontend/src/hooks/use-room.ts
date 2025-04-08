"use client";

import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "@/contexts/websocket-context";
import { rooms } from "@/lib/api";

interface Participant {
  id: string;
  username: string;
}

interface Drawing {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
}

interface DrawingData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
}

interface Room {
  id: string;
  code: string;
  host: {
    id: string;
    username: string;
  };
  participants: Participant[];
  is_active: boolean;
}

interface Message {
  type: string;
  user?: {
    id: string;
    username: string;
  };
  content?: string;
  drawing?: Drawing;
}

export function useRoom(roomCode: string | undefined) {
  const { socket, isConnected } = useWebSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!roomCode) {
      setError("Room code is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const roomData = await rooms.get(roomCode);
      setRoom(roomData);
      setParticipants(roomData.participants || []);
    } catch (err) {
      console.error("Failed to fetch room:", err);
      setError(
        "Failed to load room. Please check the room code and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (!socket || !isConnected || !roomCode) return;

    const handleMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);

      if (message.type === "participant_joined" && message.user) {
        setParticipants((prev) => [
          ...prev,
          { id: message.user.id, username: message.user.username },
        ]);
      } else if (message.type === "participant_left" && message.user) {
        setParticipants((prev) =>
          prev.filter((p) => p.id !== message.user?.id)
        );
      } else if (message.type === "drawing" && message.drawing) {
        setDrawings((prev) => [...prev, message.drawing]);
      } else if (
        message.type === "initial_drawings" &&
        Array.isArray(message.content)
      ) {
        setDrawings(message.content);
      }
    };

    socket.emit("join_room", { roomCode });
    socket.on("message", handleMessage);

    return () => {
      socket.emit("leave_room", { roomCode });
      socket.off("message", handleMessage);
    };
  }, [socket, isConnected, roomCode]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !isConnected || !roomCode) return;
      socket.emit("message", { roomCode, content, type: "chat" });
    },
    [socket, isConnected, roomCode]
  );

  const sendDrawing = useCallback(
    (data: DrawingData) => {
      if (!socket || !isConnected || !roomCode) return;
      socket.emit("drawing", { roomCode, ...data });
    },
    [socket, isConnected, roomCode]
  );

  const leaveRoom = useCallback(() => {
    if (!socket || !isConnected || !roomCode) return;
    socket.emit("leave_room", { roomCode });
  }, [socket, isConnected, roomCode]);

  return {
    room,
    participants,
    drawings,
    messages,
    loading,
    error,
    isConnected,
    sendMessage,
    sendDrawing,
    leaveRoom,
    refetch: fetchRoom,
  };
}
