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

/**
 * Emit a realtime event to all clients in a session room.
 * @param sessionId - The session ID to broadcast to
 * @param event - The event payload to send
 */
export function emitToSession(sessionId: string, event: RealtimeEvent): void {
  if (io) {
    io.to(`session:${sessionId}`).emit("session-event", event);
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
    // Join a session room
    socket.on("join-session", (sessionId: string) => {
      socket.join(`session:${sessionId}`);
    });

    // Leave a session room
    socket.on("leave-session", (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`\n🚀 SnapQuiz server ready!`);
    console.log(`   Local:   http://${hostname}:${port}`);
    console.log(`   WebSocket: ws://${hostname}:${port}/api/socket\n`);
  });
});
