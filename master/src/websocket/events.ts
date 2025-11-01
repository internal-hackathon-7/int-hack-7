import { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "./types.ts";

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  io.on("connection", (socket: Socket) => {
    console.log(`🟢 New client connected: ${socket.id}`);

    socket.on("create_room", () => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      socket.join(roomCode);
      socket.emit("room_created", roomCode);
      console.log(`✅ Room created: ${roomCode}`);
    });

    socket.on("join_room", (roomCode) => {
      const room = io.sockets.adapter.rooms.get(roomCode);
      if (room) {
        socket.join(roomCode);
        socket.emit("room_joined", roomCode);
        console.log(`👥 User joined room: ${roomCode}`);
      } else {
        socket.emit("error_message", "Room not found!");
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
    });
  });
}
