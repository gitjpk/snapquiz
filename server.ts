import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import type { RealtimeEvent } from "./src/lib/realtime/events";
import { setEmitter } from "./src/lib/sessions/sessionService";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Global Socket.IO server instance
let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

export function emitToSession(sessionId: string, event: RealtimeEvent): void {
  if (io) {
    console.log(`[Socket.IO] Emitting to session:${sessionId}`, event.type);
    io.to(`session:${sessionId}`).emit("session-event", event);
  } else {
    console.error("[Socket.IO] Cannot emit - io not initialized");
  }
}

// Register the emitter with sessionService
setEmitter(emitToSession);

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: dev ? "*" : false,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join a session room
    socket.on("join-session", (sessionId: string) => {
      const room = `session:${sessionId}`;
      socket.join(room);
      console.log(`[Socket.IO] ${socket.id} joined ${room}`);
    });

    // Leave a session room
    socket.on("leave-session", (sessionId: string) => {
      const room = `session:${sessionId}`;
      socket.leave(room);
      console.log(`[Socket.IO] ${socket.id} left ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`\n🚀 SnapQuiz server ready!`);
    console.log(`   Local:   http://${hostname}:${port}`);
    console.log(`   WebSocket: ws://${hostname}:${port}/api/socket\n`);
  });
});
