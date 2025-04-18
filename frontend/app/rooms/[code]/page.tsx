"use client";

import { useEffect, useRef, useState, ChangeEvent, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { useWebSocket } from "@/lib/services/websocket";
import { Message, WebSocketResponse } from "@/lib/types";
import { toast } from "sonner";
import api from "@/lib/services/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WebSocketStatus } from "@/components/websocket-status";
import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export default function RoomPage() {
  const { code } = useParams();
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharedText, setSharedText] = useState("");
  const { currentRoom, user } = useAppStore();
  const {
    socket,
    connect,
    disconnect,
    isConnecting,
    connectionError,
    sendMessage,
    updateSharedText,
    updateDrawing,
  } = useWebSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const router = useRouter();

  // Excalidraw API ref
  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const fetchRoom = useCallback(async () => {
    try {
      const response = await api.get(`/api/rooms/${code}`);
      const room = response.data;
      useAppStore.getState().setCurrentRoom(room);
      setMessages(room.messages);
      setSharedText(room.shared_text);
    } catch (error) {
      toast.error("Failed to load room");
      console.error("Failed to fetch room:", error);
      router.push("/rooms");
    } finally {
      setIsLoading(false);
    }
  }, [code, router]);

  useEffect(() => {
    if (!currentRoom) {
      fetchRoom();
    } else {
      setIsLoading(false);
    }
    connect(code as string);
    return () => {
      disconnect();
    };
  }, [code, currentRoom, disconnect, fetchRoom, connect]);

  useEffect(() => {
    if (socket) {
      const handleWebSocketMessage = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data) as WebSocketResponse;

          switch (response.type) {
            case "chat.message":
              if (response.content && response.sender) {
                setMessages((prev) => [
                  ...prev,
                  {
                    content: response.content,
                    sender: response.sender,
                  },
                ]);
              }
              break;
            default:
              if (
                response.action === "update_shared_text" &&
                response.shared_text
              ) {
                setSharedText(response.shared_text);
              }
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      const handleError = (event: Event) => {
        console.error("WebSocket error:", event);
        toast.error("Connection error occurred");
      };

      socket.addEventListener("message", handleWebSocketMessage);
      socket.addEventListener("error", handleError);

      return () => {
        socket.removeEventListener("message", handleWebSocketMessage);
        socket.removeEventListener("error", handleError);
      };
    }
  }, [socket]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSharedTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setSharedText(newText);
    setHasUnsavedChanges(true);
    updateSharedText(newText);
  };

  const handleSaveSharedText = async () => {
    setIsSaving(true);
    try {
      updateSharedText(sharedText, true); // true for save
      toast.success("Text saved successfully");
      setHasUnsavedChanges(false);
    } catch {
      toast.error("Failed to save text");
    } finally {
      setIsSaving(false);
    }
  };

  // Save Excalidraw drawing as JSON
  const handleSaveCanvas = async () => {
    if (!excalidrawRef.current) return;
    setIsSaving(true);
    try {
      const api = excalidrawRef.current;
      const scene = api.getSceneElements
        ? api.getSceneElements()
        : api.getScene();
      const appState = api.getAppState ? api.getAppState() : undefined;
      const files = api.getFiles ? api.getFiles() : undefined;
      const drawingData = JSON.stringify({ elements: scene, appState, files });
      updateDrawing(drawingData, true); // true for save
      toast.success("Draw saved successfully");
      setHasUnsavedChanges(false);
    } catch {
      toast.error("Failed to save draw");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChatMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    sendMessage(chatMessage);
    setChatMessage("");
  };

  const handleNavigate = (action: () => void) => {
    if (hasUnsavedChanges) {
      setIsConfirmDialogOpen(true);
      setPendingAction(() => action);
    } else {
      action();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading room...
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Room not found
      </div>
    );
  }

  // Dynamically import the Excalidraw wrapper with SSR disabled
  const ExcalidrawWrapper = dynamic(
    () => import("@/components/ui/excalidraw-wrapper"),
    {
      ssr: false,
      loading: () => (
        <div className="w-full h-full bg-gray-800 rounded-lg"></div>
      ),
    }
  );

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="h-screen flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-4">
            {/* Canvas Section */}
            <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col">
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-bold mb-2">Excalidraw</h3>

                <Button
                  onClick={handleSaveCanvas}
                  className="bg-green-600"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Draw"}
                </Button>
              </div>
              <div className="flex-1 relative mb-2">
                <div className="absolute inset-0 m-4">
                  <ExcalidrawWrapper
                    ref={excalidrawRef}
                    initialData={{
                      appState: {
                        viewBackgroundColor: "transparent",
                        theme: "dark",
                        viewModeEnabled: false,
                      },
                    }}
                    UIOptions={{
                      canvasActions: {
                        clearCanvas: true,
                        loadScene: true,
                      },
                      defaultSidebarDockedPreference: false,
                      tools: {
                        image: false,
                      },
                      dockedSidebarBreakpoint: 10000,
                    }}
                    viewModeEnabled={false}
                    zenModeEnabled={true}
                    gridModeEnabled={false}
                  />
                </div>
              </div>
            </div>

            {/* Shared Text Section */}
            <div className="h-1/3 bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-bold">Shared Text</h3>
                <Button
                  onClick={handleSaveSharedText}
                  className="bg-green-600"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Text"}
                </Button>
              </div>
              <Textarea
                value={sharedText}
                onChange={handleSharedTextChange}
                className="w-full h-[calc(100%-40px)] bg-gray-700 text-white resize-none"
                placeholder="Type something..."
              />
            </div>
          </div>

          {/* Chat Section */}
          <div className="w-full md:w-80 bg-gray-800 rounded-lg p-4 flex flex-col">
            {connectionError ? (
              <div className="text-red-400 text-center mb-4">
                {connectionError}
              </div>
            ) : null}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.sender.username === user?.username
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-2 rounded-lg ${
                      message.sender.username === user?.username
                        ? "bg-purple-600"
                        : "bg-gray-700"
                    }`}
                  >
                    <p className="text-sm font-bold">
                      {message.sender.username}
                    </p>
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={handleChatMessageChange}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700"
              />
              <Button type="submit" className="bg-purple-600">
                Send
              </Button>
            </form>
          </div>
        </div>
        <Button
          onClick={() => handleNavigate(() => router.push("/rooms"))}
          className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600"
        >
          Leave Room
        </Button>
      </div>

      <WebSocketStatus
        socket={socket}
        isConnecting={isConnecting}
        connectionError={connectionError}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => {
          setIsConfirmDialogOpen(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          if (pendingAction) {
            pendingAction();
          }
        }}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to leave this room? All unsaved changes will be lost."
        confirmText="Leave"
        cancelText="Stay"
        variant="destructive"
      />
    </>
  );
}
