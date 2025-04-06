"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { rooms } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      const room = await rooms.create();
      router.push(`/room/${room.code}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      setError("Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode) {
      setError("Please enter a room code");
      return;
    }

    try {
      await rooms.join(roomCode);
      router.push(`/room/${roomCode}`);
    } catch (error) {
      console.error("Failed to join room:", error);
      setError(
        "Failed to join room. Please check the room code and try again."
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg">
          <div>
            <h2 className="text-center text-3xl font-bold text-foreground">
              Welcome to Share Board
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              Please sign in to continue
            </p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-foreground">
            Welcome, {user?.username}!
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Create or join a room to start collaborating
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create New Room"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code"
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            />
            <button
              onClick={handleJoinRoom}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
            >
              Join Room
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-destructive text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
