import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Room } from "../model/Room.ts";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretdevkey";

export function setupSocketHandlers(io: Server) {
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
    } catch {
      console.error("❌ Invalid token");
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const googleId = (socket as any).googleId;
    const userName = (socket as any).userName;

    console.log(`🟢 Client connected: ${googleId}`);

    // Emit members of a room
    const emitMembers = async (roomId: string) => {
      const room = await Room.findOne({ roomId });
      if (!room) return;
      io.to(roomId).emit(
        "members_update",
        room.members.map((m) => ({ memberId: m }))
      );
      console.log(`📡 Members in ${roomId}:`, room.members);
    };

    socket.on("create_room", async () => {
      try {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room({ roomId, members: [googleId] });
        await room.save();
        console.log("✅ Saved room:", room);

        socket.join(roomId);
        socket.emit("room_created", { roomId });
        console.log(`🏠 Room created: ${roomId} by ${googleId}`);

        await emitMembers(roomId);
      } catch (err) {
        console.error("❌ Error creating room:", err);
        socket.emit("error_message", "Failed to create room");
      }
    });

    socket.on("join_room", async (roomId: string) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) {
          console.log("❌ Room not found:", roomId);
          socket.emit("error_message", "Room not found");
          return;
        }

        if (!room.members.includes(googleId)) {
          room.members.push(googleId);
          await room.save();
          console.log("✅ Saved room:", room);
        }

        socket.join(roomId);
        console.log(`🙋 ${googleId} joined room ${roomId}`);
        socket.emit("room_joined", { roomId });

        await emitMembers(roomId);
      } catch (err) {
        console.error("❌ Error joining room:", err);
        socket.emit("error_message", "Failed to join room");
      }
    });

    socket.on("disconnect", async () => {
      console.log(`🔴 ${googleId} disconnected`);
      try {
        const rooms = await Room.find({ members: googleId });
        for (const room of rooms) {
          room.members = room.members.filter((id) => id !== googleId);
          if (room.members.length === 0) {
            // wait 30 seconds before deleting to allow reconnect
            setTimeout(async () => {
              const checkRoom = await Room.findOne({ roomId: room.roomId });
              if (checkRoom && checkRoom.members.length === 0) {
                await Room.deleteOne({ roomId: room.roomId });
                console.log(`🗑️ Deleted inactive room ${room.roomId}`);
              }
            }, 30000);
          } else {
            await room.save();
            console.log("✅ Saved room:", room);
            await emitMembers(room.roomId);
          }
        }
      } catch (err) {
        console.error("❌ Disconnect cleanup error:", err);
      }
    });
  });
}
