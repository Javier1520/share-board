"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useRoom } from "@/hooks/use-room";
import { Canvas } from "@/components/canvas";
import { Participants } from "@/components/participants";
import { Toolbar } from "@/components/toolbar";
//import { LoadingSpinner } from "@/components/loading-spinner";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { room, participants, error, loading, leaveRoom } = useRoom(
    params.code as string
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full space-y-4 p-8 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-destructive text-center">
            Error
          </h2>
          <p className="text-center text-muted-foreground">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">
              Room: {room.code}
            </h1>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive"
            >
              Leave Room
            </button>
          </div>
          <div className="flex-1 relative">
            <Canvas />
            <Toolbar />
          </div>
        </div>
        <div className="w-64 border-l border-border">
          <Participants participants={participants} />
        </div>
      </div>
    </div>
  );
}
