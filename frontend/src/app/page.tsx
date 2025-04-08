"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { rooms } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  // Prevent duplicate navigations during fast refresh
  useEffect(() => {
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, router]);

  const handleCreateRoom = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      setError(null);

      const room = await rooms.create();

      // Store the room code in sessionStorage to prevent duplicate creation
      sessionStorage.setItem("pendingRoom", room.code);

      // Use pendingNavigation state to handle the redirect
      setPendingNavigation(`/room/${room.code}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      setError("Failed to create room. Please try again.");
      sessionStorage.removeItem("pendingRoom");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    if (isJoining) return;

    try {
      setIsJoining(true);
      setError(null);

      // Validate the room exists before navigating
      await rooms.join(roomCode);

      // Use pendingNavigation state to handle the redirect
      setPendingNavigation(`/room/${roomCode}`);
    } catch (error) {
      console.error("Failed to join room:", error);
      setError(
        "Failed to join room. Please check the room code and try again."
      );
    } finally {
      setIsJoining(false);
    }
  };

  // Check for pending room creation on mount
  useEffect(() => {
    const pendingRoom = sessionStorage.getItem("pendingRoom");
    if (pendingRoom) {
      sessionStorage.removeItem("pendingRoom");
      setPendingNavigation(`/room/${pendingRoom}`);
    }
  }, []);

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
            {isCreating ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </span>
            ) : (
              "Create New Room"
            )}
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
              onChange={(e) => {
                setRoomCode(e.target.value);
                setError(null);
              }}
              placeholder="Enter room code"
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJoinRoom();
                }
              }}
            />
            <button
              onClick={handleJoinRoom}
              disabled={isJoining}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
            >
              {isJoining ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Joining...
                </span>
              ) : (
                "Join Room"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
