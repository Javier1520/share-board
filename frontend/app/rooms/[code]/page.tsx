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

interface DrawingData {
  drawing_data: string;
}

export default function RoomPage() {
  const { code } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sharedText, setSharedText] = useState("");
  const { currentRoom, drawingColor, isErasing, user } = useAppStore();
  const { socket, connect, disconnect, isConnecting, connectionError, sendMessage, updateSharedText, updateDrawing } = useWebSocket();
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isClearCanvasDialogOpen, setIsClearCanvasDialogOpen] = useState(false);
  const router = useRouter();

  const loadDrawing = useCallback(
    (drawingData: string) => {
      if (ctx && canvasRef.current) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(
            0,
            0,
            canvasRef.current!.width,
            canvasRef.current!.height
          );
          ctx.drawImage(img, 0, 0);
        };
        img.src = drawingData;
      }
    },
    [ctx]
  );

  const fetchRoom = useCallback(async () => {
    try {
      const response = await api.get(`/api/rooms/${code}`);
      const room = response.data;
      useAppStore.getState().setCurrentRoom(room);
      setMessages(room.messages);
      setSharedText(room.shared_text);
      if (room.drawing_data) {
        loadDrawing(room.drawing_data);
      }
    } catch (error) {
      toast.error("Failed to load room");
      console.error("Failed to fetch room:", error);
      router.push("/rooms");
    } finally {
      setIsLoading(false);
    }
  }, [code, loadDrawing, router]);

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
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        setCtx(context);
        // Set initial canvas size
        resizeCanvas();
        // Add resize listener
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
      }
    }
  }, []);

  const resizeCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    }
  };

  useEffect(() => {
    if (socket) {
      const handleWebSocketMessage = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data) as WebSocketResponse;
          
          switch (response.type) {
            case 'chat.message':
              if (response.content && response.sender) {
                setMessages(prev => [...prev, {
                  content: response.content,
                  sender: response.sender
                }]);
              }
              break;
            default:
              if (response.action === 'update_shared_text' && response.shared_text) {
                setSharedText(response.shared_text);
              } else if (response.action === 'update_drawing' && response.drawing_data) {
                loadDrawing(response.drawing_data);
              }
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      const handleError = (event: Event) => {
        console.error('WebSocket error:', event);
        toast.error('Connection error occurred');
      };

      socket.addEventListener('message', handleWebSocketMessage);
      socket.addEventListener('error', handleError);

      return () => {
        socket.removeEventListener('message', handleWebSocketMessage);
        socket.removeEventListener('error', handleError);
      };
    }
  }, [socket, loadDrawing]);

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
    } catch (error) {
      toast.error("Failed to save text");
    } finally {
      setIsSaving(false);
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    setLastX(x);
    setLastY(y);
  };

  const handleDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !ctx || !canvasRef.current) return;

    const { x, y } = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = isErasing ? "#000000" : drawingColor;
    ctx.lineWidth = isErasing ? 20 : 2;
    ctx.lineCap = "round";
    ctx.stroke();

    setLastX(x);
    setLastY(y);
    setHasUnsavedChanges(true);

    updateDrawing(canvasRef.current.toDataURL());
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCanvasCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    if ("touches" in e) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleClearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      updateDrawing(canvasRef.current.toDataURL());
      setHasUnsavedChanges(true);
    }
  };

  const handleSaveCanvas = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      updateDrawing(canvasRef.current.toDataURL(), true); // true for save
      toast.success("Canvas saved successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to save canvas");
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
            {/* Canvas Section */}
            <div className="flex-1 bg-gray-800 rounded-lg p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <input
                  type="color"
                  value={drawingColor}
                  onChange={(e) =>
                    useAppStore.getState().setDrawingColor(e.target.value)
                  }
                  className="w-8 h-8"
                />
                <Button
                  onClick={() =>
                    useAppStore.getState().setIsErasing(!isErasing)
                  }
                  className={`${isErasing ? "bg-red-600" : "bg-gray-600"}`}
                >
                  {isErasing ? "Eraser On" : "Eraser Off"}
                </Button>
                <Button
                  onClick={() => setIsClearCanvasDialogOpen(true)}
                  className="bg-gray-600"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSaveCanvas}
                  className="bg-green-600"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Canvas"}
                </Button>
              </div>
              <canvas
                ref={canvasRef}
                className="w-full h-[calc(100%-48px)] bg-white rounded touch-none"
                onMouseDown={startDrawing}
                onMouseMove={handleDraw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={handleDraw}
                onTouchEnd={stopDrawing}
              />
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

      <ConfirmDialog
        isOpen={isClearCanvasDialogOpen}
        onClose={() => setIsClearCanvasDialogOpen(false)}
        onConfirm={handleClearCanvas}
        title="Clear Canvas"
        description="Are you sure you want to clear the canvas? This action cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
