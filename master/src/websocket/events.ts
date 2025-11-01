import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Room } from "../model/Room.ts";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretdevkey";

export function setupWebSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  // ✅ AUTH middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing token"));

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        name?: string;
      };
      (socket as any).googleId = decoded.sub;
      (socket as any).userName = decoded.name || decoded.sub;
      next();
    } catch (err) {
      console.error("❌ Invalid JWT:", err);
      next(new Error("Authentication error"));
    }
  });

  // ✅ Main connection logic
  io.on("connection", async (socket: Socket) => {
    const googleId = (socket as any).googleId;
    const userName = (socket as any).userName;

    console.log(`🟢 Connected: ${googleId}`);

    socket.emit("connected", { googleId, userName });

    // Helper → send all members of room
    const emitMembers = async (roomId: string) => {
      const room = await Room.findOne({ roomId });
      if (!room) return;
      const members = room.members.map((m) => ({ memberId: m }));
      io.to(roomId).emit("members_update", members);
      console.log(`📡 Room ${roomId} members:`, members);
    };

    // --- CREATE ROOM ---
    socket.on("create_room", async () => {
      try {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room({ roomId, members: [googleId] });
        await room.save();

        socket.join(roomId);
        socket.emit("room_created", { roomId });
        console.log(`🏠 ${googleId} created room ${roomId}`);

        await emitMembers(roomId);
      } catch (err) {
        console.error("❌ create_room error:", err);
        socket.emit("error_message", "Failed to create room");
      }
    });

    // --- JOIN ROOM ---
    socket.on("join_room", async (roomId: string) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) {
          console.log("❌ Room not found:", roomId);
          socket.emit("error_message", "Room not found");
          return;
        }

        // Add user to members if not present
        if (!room.members.includes(googleId)) {
          room.members.push(googleId);
          await room.save();
        }

        socket.join(roomId);
        socket.emit("room_joined", { roomId });
        console.log(`🙋 ${googleId} joined ${roomId}`);

        await emitMembers(roomId);
      } catch (err) {
        console.error("❌ join_room error:", err);
        socket.emit("error_message", "Failed to join room");
      }
    });

    // --- DISCONNECT ---
    socket.on("disconnect", async () => {
      console.log(`🔴 ${googleId} disconnected`);
      try {
        const rooms = await Room.find({ members: googleId });

        for (const room of rooms) {
          room.members = room.members.filter((id) => id !== googleId);
          if (room.members.length === 0) {
            await Room.deleteOne({ roomId: room.roomId });
            console.log(`🗑️ Room ${room.roomId} deleted`);
          } else {
            await room.save();
            await emitMembers(room.roomId);
          }
        }
      } catch (err) {
        console.error("❌ Disconnect error:", err);
      }
    });
  });
}
