"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { Room } from "@/lib/types";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import api from "@/lib/services/api";

export default function RoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joiningRoomCode, setJoiningRoomCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const router = useRouter();
  const { setCurrentRoom } = useAppStore();
  const { logout } = useAuth();

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/rooms", {
        params: {
          page: currentPage,
          page_size: pageSize,
        },
      });
      setRooms(response.data.results);
      setTotalRooms(response.data.count);
      setTotalPages(Math.ceil(response.data.count / pageSize));
    } catch (error) {
      toast.error("Failed to fetch rooms");
      console.error("Failed to fetch rooms:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize, 10));
    setCurrentPage(1);
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
              <Button onClick={createRoom} disabled={isLoading && !isJoining}>
                {isLoading && !isJoining ? "Creating..." : "Create Room"}
              </Button>
            </div>
            <Button
              onClick={logout}
              disabled={isLoading || isJoining}
              variant={"destructive"}
            >
              Logout
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : totalRooms === 0 ? (
          <div className="text-center text-gray-400 h-64 flex items-center justify-center">
            No rooms available
          </div>
        ) : (
          <>
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
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-md">
                      <Spinner size="medium" className="text-white" />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6 text-white">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-[70px] bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
