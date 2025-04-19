"use client";

import {
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  useCallback,
  memo,
} from "react";
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

// Dynamically import the Excalidraw wrapper with SSR disabled
const ExcalidrawWrapper = dynamic(
  () => import("@/components/ui/excalidraw-wrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-800 rounded-lg">
        Loading Excalidraw...
      </div>
    ),
  }
);

const ExcalidrawSection = memo(
  ({
    excalidrawRef,
    isSaving,
    handleSaveCanvas,
    onChange,
    initialDrawingData, // Add prop for initial drawing data
  }: {
    excalidrawRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
    isSaving: boolean;
    handleSaveCanvas: () => void;
    onChange?: (elements: readonly any[], appState: any, files: any) => void;
    initialDrawingData?: {
      elements: readonly any[];
      appState: any;
      files: any;
    }; // Type for initial data
  }) => {
    console.log("ExcalidrawSection rendered", { isSaving, initialDrawingData }); // Debug log
    return (
      <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col">
        <div className="flex justify-between mb-2">
          <h3 className="text-lg font-bold mb-2">Excalidraw</h3>
          <Button
            onClick={() => {
              console.log("Save Draw button clicked, calling handleSaveCanvas"); // Debug log
              handleSaveCanvas();
            }}
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
              onChange={(elements, appState, files) => {
                console.log("Excalidraw onChange triggered", {
                  elementsLength: elements.length,
                  appState,
                  files,
                }); // Debug log
                onChange?.(elements, appState, files);
              }}
              initialData={{
                elements: initialDrawingData?.elements || [],
                appState: {
                  viewBackgroundColor: "transparent",
                  theme: "dark",
                  viewModeEnabled: false,
                  ...(initialDrawingData?.appState || {}),
                },
                files: initialDrawingData?.files || {},
              }}
              UIOptions={{
                canvasActions: {
                  clearCanvas: true,
                  loadScene: true,
                },
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
    );
  }
);

ExcalidrawSection.displayName = "ExcalidrawSection";

export default function RoomPage() {
  const { code } = useParams();
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharedText, setSharedText] = useState("");
  const [drawingData, setDrawingData] = useState<{
    elements: readonly any[];
    appState: any;
    files: any;
  } | null>(null); // State for drawing data
  const { currentRoom, user, setCurrentRoom } = useAppStore();
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
  // Ref to store drawing data
  const drawingDataRef = useRef<{
    elements: readonly any[];
    appState: any;
    files: any;
  } | null>(null);

  const fetchRoom = useCallback(async () => {
    try {
      const response = await api.get(`/api/rooms/${code}`);
      const room = response.data;
      setCurrentRoom(room);
      setMessages(room.messages || []);
      setSharedText(room.shared_text || "");
      setDrawingData(room.drawing ? JSON.parse(room.drawing) : null);
    } catch (error) {
      console.error("Failed to fetch room:", error);
      toast.error("Failed to load room");
      router.push("/rooms");
    } finally {
      setIsLoading(false);
    }
  }, [code, router, setCurrentRoom]);

  useEffect(() => {
    console.log("Initial useEffect, currentRoom:", currentRoom); // Debug log
    // Always fetch room data on mount to avoid stale state
    fetchRoom();
    connect(code as string);
    return () => {
      disconnect();
    };
  }, [code, fetchRoom, connect, disconnect]); // Removed currentRoom dependency

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
              // Handle drawing updates via WebSocket if supported
              if (response.action === "update_drawing" && response.drawing) {
                try {
                  const parsedDrawing = JSON.parse(response.drawing);
                  setDrawingData(parsedDrawing);
                  console.log("WebSocket drawing update:", parsedDrawing); // Debug log
                } catch (error) {
                  console.error("Failed to parse WebSocket drawing:", error);
                }
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
    console.log("Saving shared text:", sharedText);
    setIsSaving(true);
    try {
      await updateSharedText(sharedText, true);
      toast.success("Text saved successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save text:", error);
      toast.error("Failed to save text");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCanvas = async () => {
    console.log("handleSaveCanvas called");
    console.log("excalidrawRef.current:", excalidrawRef.current);
    console.log("drawingDataRef.current:", drawingDataRef.current);
    setIsSaving(true);
    try {
      let drawingData;
      if (drawingDataRef.current) {
        drawingData = JSON.stringify(drawingDataRef.current);
        console.log("Using drawingDataRef for save:", drawingData);
      } else if (excalidrawRef.current) {
        const elements = excalidrawRef.current.getSceneElements
          ? excalidrawRef.current.getSceneElements()
          : [];
        const appState = excalidrawRef.current.getAppState
          ? excalidrawRef.current.getAppState()
          : {};
        const files = excalidrawRef.current.getFiles
          ? excalidrawRef.current.getFiles()
          : {};
        drawingData = JSON.stringify({ elements, appState, files });
        console.log("Using fallback data from excalidrawRef:", drawingData);
      } else {
        throw new Error("No drawing data available");
      }
      await updateDrawing(drawingData, true);
      toast.success("Draw saved successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save draw:", error);
      toast.error("Failed to save draw");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcalidrawChange = (
    elements: readonly any[],
    appState: any,
    files: any
  ) => {
    console.log("handleExcalidrawChange called", {
      elementsLength: elements.length,
    });
    drawingDataRef.current = { elements, appState, files };
    setHasUnsavedChanges(true);
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

  // Assume reload button calls this
  const handleReload = () => {
    console.log("Reload button clicked");
    fetchRoom();
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

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="h-screen flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-4">
            <ExcalidrawSection
              excalidrawRef={excalidrawRef}
              isSaving={isSaving}
              handleSaveCanvas={handleSaveCanvas}
              onChange={handleExcalidrawChange}
              initialDrawingData={drawingData} // Pass drawing data
            />

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
        {/* Reload Button (for testing, adjust as needed) */}
        <Button
          onClick={handleReload}
          className="absolute top-4 right-20 bg-blue-600 hover:bg-blue-500"
        >
          Reload
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
