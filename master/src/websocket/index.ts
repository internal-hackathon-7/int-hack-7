import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupSocketHandlers } from "./events"; // ❌ remove `.ts` extension

export function setupWebSocket(server: Server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log("⚡ Socket.IO server initialized");

  setupSocketHandlers(io); // attach event handlers
  return io;
}
