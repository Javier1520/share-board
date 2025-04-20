"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { Room } from "@/lib/types";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import api from "@/lib/services/api";

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joiningRoomCode, setJoiningRoomCode] = useState<string | null>(null);
  const router = useRouter();
  const { setCurrentRoom } = useAppStore();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/rooms");
      setRooms(response.data);
    } catch (error) {
      toast.error("Failed to fetch rooms");
      console.error("Failed to fetch rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async () => {
    setIsLoading(true);
    try {
      const response = await api.post("/api/rooms");
      const room = response.data;
      setCurrentRoom(room);
      toast.success("Room created successfully");
      router.push(`/rooms/${room.code}`);
    } catch (error) {
      toast.error("Failed to create room");
      console.error("Failed to create room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode) {
      toast.error("Please enter a room code");
      return;
    }

    setIsJoining(true);
    try {
      const response = await api.get(`/api/rooms/${roomCode}`);
      const room = response.data;
      setCurrentRoom(room);
      toast.success("Joined room successfully");
      router.push(`/rooms/${roomCode}`);
    } catch (error) {
      toast.error("Failed to join room. Please check the room code.");
      console.error("Failed to join room:", error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h1 className="text-2xl font-bold text-white">Rooms</h1>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="bg-gray-800 text-white border-gray-700"
                disabled={isJoining}
              />
              <Button onClick={joinRoom} disabled={isJoining}>
                {isJoining ? "Joining..." : "Join Room"}
              </Button>
            </div>
            <Button onClick={createRoom} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center text-gray-400">No rooms available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card
                key={room.code}
                className={`p-4 bg-gray-800 text-white relative ${
                  joiningRoomCode
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-700 cursor-pointer"
                } transition-colors`}
                onClick={
                  joiningRoomCode
                    ? undefined
                    : () => {
                        setJoiningRoomCode(room.code);
                        setCurrentRoom(room);
                        router.push(`/rooms/${room.code}`);
                      }
                }
              >
                <h3 className="font-bold mb-2">Room #{room.id}</h3>
                <p className="text-sm text-gray-400">Code: {room.code}</p>
                <p className="text-sm text-gray-400">
                  Created: {new Date(room.created_at).toLocaleDateString()}
                </p>
                {joiningRoomCode === room.code && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                    <Spinner size="small" className="text-white" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
