import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { setupSocketHandlers } from "./events.ts";

export function setupWebSocket(server: Server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:5173", // your frontend origin
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log("⚡ Socket.IO server initialized");

  setupSocketHandlers(io); // attach all event listeners

  return io;
}
