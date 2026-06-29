'use client';

import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export function useSocket(
  token: string | null,
  onNotification: (data: { title: string; message: string; type: string }) => void
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    socketRef.current = getSocket(token);

    socketRef.current.on('notification', onNotification);

    return () => {
      socketRef.current?.off('notification', onNotification);
    };
  }, [token, onNotification]);

  return socketRef.current;
}
