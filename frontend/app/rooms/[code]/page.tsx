"use client";

import {
  useEffect,
  useState,
  ChangeEvent,
  useCallback,
  memo,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { useWebSocket } from "@/lib/services/websocket";
import { Message, User, WebSocketResponse } from "@/lib/types";
import { toast } from "sonner";
import api from "@/lib/services/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WebSocketStatus } from "@/components/websocket-status";
import { ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
} from "@excalidraw/excalidraw/types";
import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

interface DrawingData {
  elements: readonly ExcalidrawElement[];
  appState: Pick<AppState, keyof AppState>;
  files: BinaryFiles;
}

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

interface ExcalidrawSectionProps {
  onExcalidrawAPIReady: (api: ExcalidrawImperativeAPI) => void;
  isExcalidrawReady: boolean;
  isSaving: boolean;
  handleSaveCanvas: () => void;
  initialDrawingData?: DrawingData;
}

const ExcalidrawSection = memo(
  ({
    onExcalidrawAPIReady,
    isExcalidrawReady,
    isSaving,
    handleSaveCanvas,
    initialDrawingData,
  }: ExcalidrawSectionProps) => {
    return (
      <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col">
        <div className="flex justify-between mb-2">
          <h3 className="text-lg font-bold mb-2">Excalidraw</h3>
          <Button
            onClick={handleSaveCanvas}
            disabled={!isExcalidrawReady || isSaving}
          >
            {isSaving ? "Saving..." : "Save Draw"}
          </Button>
        </div>
        <div className="flex-1 relative mb-2">
          <div className="absolute inset-0 m-4">
            <ExcalidrawWrapper
              excalidrawAPI={onExcalidrawAPIReady}
              initialData={{
                elements: initialDrawingData?.elements || [],
                appState: {
                  viewBackgroundColor: "transparent",
                  theme: "dark",
                  viewModeEnabled: false,
                  ...(initialDrawingData?.appState || {}),
                  collaborators: new Map(),
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
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);
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

  // scroll handling
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    setIsAtBottom(atBottom);
  };

  // auto-scroll on new messages
  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isAtBottom, scrollToBottom]);

  // Excalidraw API state
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const isExcalidrawReady = !!excalidrawAPI;

  const fetchRoom = useCallback(async () => {
    try {
      const response = await api.get(`/api/rooms/${code}`);
      const room = response.data;
      setCurrentRoom(room);
      setMessages(room.messages || []);
      setSharedText(room.shared_text || "");
      setDrawingData(room.drawing_data ? JSON.parse(room.drawing_data) : null);
    } catch (error) {
      console.error("Failed to fetch room:", error);
      toast.error("Failed to load room");
      router.push("/rooms");
    } finally {
      setIsLoading(false);
    }
  }, [code, router, setCurrentRoom]);

  useEffect(() => {
    console.log("Initial useEffect, currentRoom");
    fetchRoom();
    connect(code as string);
    return () => {
      disconnect();
    };
  }, [code, fetchRoom, connect, disconnect]);

  useEffect(() => {
    if (socket) {
      const handleWebSocketMessage = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data) as WebSocketResponse;

          switch (response.type) {
            case "chat.message":
              if (response.content && response.sender) {
                const sender: User =
                  typeof response.sender === "string"
                    ? { username: response.sender }
                    : response.sender;
                setMessages((prev) => [
                  ...prev,
                  {
                    content: response.content,
                    sender: sender,
                  } as Message,
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
              if (
                response.action === "update_drawing" &&
                response.drawing_data
              ) {
                try {
                  const parsedDrawing = JSON.parse(
                    response.drawing_data
                  ) as DrawingData;
                  setDrawingData(parsedDrawing);
                  excalidrawAPI?.updateScene({
                    elements: parsedDrawing.elements,
                    appState: {
                      ...excalidrawAPI.getAppState(), // Keep current app state
                      ...parsedDrawing.appState, // Apply updates
                    },
                    collaborators: new Map(),
                  });

                  console.log("WebSocket drawing update:", parsedDrawing);
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
  }, [socket, excalidrawAPI]);

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
    if (!excalidrawAPI) {
      toast.error("Excalidraw is not ready yet. Please try again later.");
      return;
    }
    setIsSaving(true);
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();
      const drawingData = JSON.stringify({ elements, appState, files });

      await updateDrawing(drawingData, true);
      await updateDrawing(drawingData);
      toast.success("Draw saved successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save draw:", error);
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

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="h-screen flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-4">
            <ExcalidrawSection
              onExcalidrawAPIReady={(api) => setExcalidrawAPI(api)}
              isExcalidrawReady={isExcalidrawReady}
              isSaving={isSaving}
              handleSaveCanvas={handleSaveCanvas}
              initialDrawingData={drawingData ?? undefined}
            />

            <div className="h-1/3 bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-bold">Shared Text</h3>
                <Button onClick={handleSaveSharedText} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Text"}
                </Button>
              </div>
              <Textarea
                value={sharedText}
                onChange={handleSharedTextChange}
                className="w-full h-[calc(100%-40px)] bg-gray-700 text-white break-all"
                placeholder="Type something..."
              />
            </div>
          </div>

          <div className="w-full md:w-80 bg-gray-800 rounded-lg p-4 flex flex-col">
            <div className="flex justify-end mb-2">
              <Button
                onClick={() => handleNavigate(() => router.push("/rooms"))}
                variant={"destructive"}
              >
                Leave Room
              </Button>
            </div>
            {connectionError ? (
              <div className="text-red-400 text-center mb-4">
                {connectionError}
              </div>
            ) : null}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto mb-4 space-y-4"
            >
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
                    className={`max-w-[80%] p-2 rounded-lg break-words ${
                      message.sender.username === user?.username
                        ? "bg-primary"
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

              {!isAtBottom && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-2 right-2 bg-gray-700 p-2 rounded-full shadow-lg"
                >
                  <ChevronDown size={20} />
                </button>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={handleChatMessageChange}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700"
              />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </div>
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
