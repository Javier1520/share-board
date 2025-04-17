'use client';

import { useEffect, useState } from 'react';

interface WebSocketStatusProps {
  socket: WebSocket | null;
  isConnecting: boolean;
  connectionError: string | null;
}

export function WebSocketStatus({ socket, isConnecting, connectionError }: WebSocketStatusProps) {
  const [reconnectCount, setReconnectCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleConnectionStateChange = () => {
      if (socket.readyState === WebSocket.CONNECTING) {
        setIsReconnecting(true);
        setReconnectCount(prev => prev + 1);
      } else if (socket.readyState === WebSocket.OPEN) {
        setIsReconnecting(false);
        setReconnectCount(0);
      }
    };

    socket.addEventListener('connecting', handleConnectionStateChange);
    socket.addEventListener('open', handleConnectionStateChange);
    socket.addEventListener('close', () => setIsReconnecting(false));

    return () => {
      socket.removeEventListener('connecting', handleConnectionStateChange);
      socket.removeEventListener('open', handleConnectionStateChange);
      socket.removeEventListener('close', () => setIsReconnecting(false));
    };
  }, [socket]);

  if (!socket || (!isConnecting && !connectionError && !isReconnecting)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 text-white flex items-center gap-2">
        {isConnecting ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full" />
            <span>Connecting...</span>
          </>
        ) : isReconnecting ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />
            <span>Reconnecting... (Attempt {reconnectCount})</span>
          </>
        ) : connectionError ? (
          <>
            <div className="h-4 w-4 bg-red-500 rounded-full" />
            <span className="text-red-400">{connectionError}</span>
          </>
        ) : (
          <>
            <div className="h-4 w-4 bg-green-500 rounded-full" />
            <span>Connected</span>
          </>
        )}
      </div>
    </div>
  );
}