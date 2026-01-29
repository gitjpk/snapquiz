"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { RealtimeEvent } from "./events";

type EventHandler = (event: RealtimeEvent) => void;

/**
 * Hook to connect to a session's realtime events
 */
export function useSessionSocket(
  sessionId: string | null,
  onEvent: EventHandler
) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Keep callback ref updated to avoid reconnection on handler change
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!sessionId) return;

    // Connect to Socket.IO server
    const socket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);
      socket.emit("join-session", sessionId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      setError(err);
      setIsConnected(false);
    });

    socket.on("session-event", (event: RealtimeEvent) => {
      onEventRef.current(event);
    });

    return () => {
      socket.emit("leave-session", sessionId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]); // Only reconnect when sessionId changes

  return { isConnected, error };
}

/**
 * Create a standalone socket connection (for non-hook usage)
 */
export function createSessionSocket(
  sessionId: string,
  onEvent: EventHandler
): { disconnect: () => void } {
  const socket = io({
    path: "/api/socket",
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    socket.emit("join-session", sessionId);
  });

  socket.on("session-event", (event: RealtimeEvent) => {
    onEvent(event);
  });

  return {
    disconnect: () => {
      socket.emit("leave-session", sessionId);
      socket.disconnect();
    },
  };
}
