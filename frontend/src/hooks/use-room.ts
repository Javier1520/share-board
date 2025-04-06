import { useEffect, useState } from "react";
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
  code: string;
  participants: Participant[];
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

export function useRoom(roomCode: string) {
  const { socket, isConnected } = useWebSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const roomData = await rooms.get(roomCode);
        setRoom(roomData);
        setParticipants(roomData.participants);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch room:", error);
        setError("Failed to load room");
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomCode]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("join_room", { roomCode });

    const handleMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);

      if (message.type === "participant_joined") {
        const username = message.user?.username;
        if (username) {
          setParticipants((prev) => [
            ...prev,
            { id: message.user!.id, username },
          ]);
        }
      } else if (message.type === "participant_left") {
        setParticipants((prev) =>
          prev.filter((p) => p.id !== message.user?.id)
        );
      } else if (message.type === "drawing" && message.drawing) {
        setDrawings((prev) => [...prev, message.drawing as Drawing]);
      }
    };

    socket.on("message", handleMessage);

    return () => {
      socket.emit("leave_room", { roomCode });
      socket.off("message", handleMessage);
    };
  }, [socket, isConnected, roomCode]);

  const sendMessage = async (content: string) => {
    if (!socket || !isConnected) return;
    socket.emit("message", { roomCode, content });
  };

  const sendDrawing = async (data: DrawingData) => {
    if (!socket || !isConnected) return;
    socket.emit("drawing", { roomCode, ...data });
  };

  const leaveRoom = async () => {
    if (!socket || !isConnected) return;
    socket.emit("leave_room", { roomCode });
  };

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
  };
}
