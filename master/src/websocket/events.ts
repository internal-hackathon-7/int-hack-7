import { Server, Socket } from "socket.io";

interface Member {
  memberId: string;
}

interface RoomData {
  members: Member[];
}

const rooms = new Map<string, RoomData>();

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`🟢 New client connected: ${socket.id}`);

    // Let frontend know its own socket ID
    socket.emit("connected", { socketId: socket.id });

    // ───────────────────────────── CREATE ROOM ─────────────────────────────
    socket.on("create_room", () => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

      socket.join(roomId);
      console.log(`🏠 Room ${roomId} created by ${socket.id}`);

      // Create room data
      const newRoom: RoomData = { members: [{ memberId: socket.id }] };
      rooms.set(roomId, newRoom);

      // Notify the creator
      socket.emit("room_created", { roomId, memberId: socket.id });

      // Send updated members list to everyone in room
      io.to(roomId).emit("members_update", newRoom.members);
    });

    // ───────────────────────────── JOIN ROOM ─────────────────────────────
    socket.on("join_room", (roomId: string) => {
      let room = rooms.get(roomId);

      // If the room doesn't exist, create it dynamically
      if (!room) {
        console.log(`⚙️ Room ${roomId} not found — creating new one.`);
        room = { members: [] };
        rooms.set(roomId, room);
      }

      socket.join(roomId);
      room.members.push({ memberId: socket.id });
      console.log(`🙋 ${socket.id} joined room ${roomId}`);

      socket.emit("room_joined", { roomId, memberId: socket.id });
      io.to(roomId).emit("members_update", room.members);
    });

    // ───────────────────────────── DISCONNECT ─────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔴 ${socket.id} disconnected`);

      // Remove user from all rooms they were part of
      for (const [roomId, room] of rooms.entries()) {
        const before = room.members.length;
        room.members = room.members.filter((m) => m.memberId !== socket.id);

        if (room.members.length < before) {
          console.log(`👋 ${socket.id} left room ${roomId}`);
          io.to(roomId).emit("members_update", room.members);

          // If room is empty, delete it
          if (room.members.length === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} deleted (empty)`);
          }
        }
      }
    });
  });
}
