"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AuthContext from "../../layout";
import { getWebSocketTicket } from "../../../services/api";
import { RoomWebSocket } from "../../../services/websocket";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";

interface ChatMessage {
  sender: string;
  content: string;
}

export default function RoomPage() {
  const auth = useContext(AuthContext);
  const router = useRouter();
  const params = useParams();
  const roomCode = params.code as string;
  const [ws, setWs] = useState<RoomWebSocket | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sharedText, setSharedText] = useState("");
  const [drawingData, setDrawingData] = useState<any>({});
  const [color, setColor] = useState("#e4e4e7");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !auth?.access) {
      router.replace("/");
    }
  }, [hydrated, auth?.access, router]);

  if (!hydrated) return null;
  if (!auth?.access) return null;

  // Get username from token (for chat alignment)
  useEffect(() => {
    if (!auth?.access) return;
    try {
      const payload = JSON.parse(atob(auth.access.split(".")[1]));
      setUsername(payload.username);
    } catch {}
  }, [auth?.access]);

  // Connect WebSocket
  useEffect(() => {
    if (!auth?.access) {
      router.replace("/");
      return;
    }
    let wsInstance: RoomWebSocket;
    let ticketToken: string;
    let isMounted = true;
    getWebSocketTicket(roomCode, auth.access)
      .then(({ token }) => {
        ticketToken = token;
        wsInstance = new RoomWebSocket();
        wsInstance.connect({
          roomCode,
          ticket: token,
          onMessage: handleWsMessage,
          onClose: handleWsClose,
        });
        if (isMounted) setWs(wsInstance);
      })
      .catch(() => {
        setError("Failed to connect to room.");
        router.replace("/home");
      });
    return () => {
      isMounted = false;
      wsInstance?.disconnect();
    };
    // eslint-disable-next-line
  }, [roomCode, auth?.access]);

  // WebSocket message handler
  function handleWsMessage(data: any) {
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {}
    }
    if (data.type === "chat.message" || data.action === "message") {
      setChat((prev) => [
        ...prev,
        { sender: data.sender, content: data.content },
      ]);
    } else if (data.action === "update_shared_text") {
      setSharedText(data.shared_text);
    } else if (data.action === "update_drawing") {
      setDrawingData(data.drawing_data);
      // Optionally update canvas here
    }
  }

  // WebSocket close handler
  function handleWsClose(code: number, reason: string) {
    if ([4001, 4002, 4003].includes(code)) {
      setError("WebSocket error: " + reason);
      router.replace("/home");
    }
  }

  // Chat send
  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    ws?.send("message", { action: "message", content: chatInput });
    setChatInput("");
  }

  // Shared text live update
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setSharedText(e.target.value);
    ws?.send("update_shared_text", {
      action: "update_shared_text",
      shared_text: e.target.value,
    });
  }

  // Save shared text
  function saveText() {
    ws?.send("save_shared_text", {
      action: "save_shared_text",
      shared_text: sharedText,
    });
  }

  // Drawing logic (simplified for brevity)
  function handleCanvasPointer(e: React.PointerEvent<HTMLCanvasElement>) {
    // ...drawing logic here...
    // On draw, send update_drawing
    // ws?.send("update_drawing", { action: "update_drawing", drawing_data: ... });
  }
  function clearCanvas() {
    setDrawingData({});
    ws?.send("update_drawing", { action: "update_drawing", drawing_data: {} });
  }
  function saveCanvas() {
    ws?.send("save_drawing", { action: "save_drawing", drawing_data });
  }

  // Leave room
  function leaveRoom() {
    ws?.disconnect();
    router.replace("/home");
  }

  // Responsive layout
  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] text-[#e4e4e7]">
      <div className="flex flex-1 flex-col md:flex-row gap-2 p-2 md:p-4">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center">
          <Card className="w-full max-w-2xl bg-[#23232a] p-2 mb-2">
            <div className="flex gap-2 mb-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 p-0 border-none bg-transparent"
              />
              <Button
                size="sm"
                variant={tool === "pen" ? "default" : "ghost"}
                onClick={() => setTool("pen")}
              >
                Pen
              </Button>
              <Button
                size="sm"
                variant={tool === "eraser" ? "default" : "ghost"}
                onClick={() => setTool("eraser")}
              >
                Eraser
              </Button>
              <Button size="sm" variant="ghost" onClick={clearCanvas}>
                Clear
              </Button>
              <Button size="sm" onClick={saveCanvas}>
                Save Canvas
              </Button>
            </div>
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              className="w-full h-48 bg-[#18181b] border border-[#31313a] rounded"
              onPointerDown={handleCanvasPointer}
              // ...other pointer events for drawing...
            />
          </Card>
        </div>
        {/* Chat Area */}
        <div className="w-full md:w-80 flex flex-col">
          <Card className="flex-1 bg-[#23232a] p-2 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-2 mb-2">
              {chat.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.sender === username ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-3 py-1 rounded-lg max-w-[80%] ${
                      msg.sender === username
                        ? "bg-[#3b3b4f] text-right"
                        : "bg-[#23232a] text-left border border-[#31313a]"
                    }`}
                  >
                    <span className="block text-xs text-[#a1a1aa]">
                      {msg.sender}
                    </span>
                    <span>{msg.content}</span>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="bg-[#18181b] border-[#31313a] text-[#e4e4e7]"
              />
              <Button type="submit">Send</Button>
            </form>
          </Card>
        </div>
      </div>
      {/* Shared Text Area */}
      <div className="w-full flex flex-col items-center p-2 md:p-4">
        <Card className="w-full max-w-2xl bg-[#23232a] p-2 flex flex-col gap-2">
          <Textarea
            value={sharedText}
            onChange={handleTextChange}
            placeholder="Shared text..."
            className="bg-[#18181b] border-[#31313a] text-[#e4e4e7] min-h-[60px]"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={saveText}>
              Save Text
            </Button>
            <Button size="sm" variant="ghost" onClick={leaveRoom}>
              Leave Room
            </Button>
          </div>
        </Card>
      </div>
      {error && (
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 bg-red-700 text-white px-4 py-2 rounded shadow">
          {error}
        </div>
      )}
    </div>
  );
}
