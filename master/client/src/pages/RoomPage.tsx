"use client";
import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import "./Home.css";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "http://localhost:3000";

interface Member {
  memberId: string;
}

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

useEffect(() => {
  const socket = io(WS_BASE, {
    transports: ["websocket"],
    withCredentials: true,
  });

  setSocket(socket);

  socket.on("connect", () => {
    console.log("✅ Connected to server");
    if (roomId) {
      socket.emit("join_room", roomId);
      console.log(`Joining room ${roomId}`);
    }
  });

  socket.on("members_update", (memberList: Member[]) => {
    console.log("📜 Members update:", memberList);
    setMembers(memberList);
  });

  socket.on("member_joined", (newMember: Member) => {
    setMembers((prev) => [...prev, newMember]);
  });

  socket.on("member_left", (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.memberId !== memberId));
  });

  socket.on("disconnect", () => console.log("🔴 Disconnected"));

  return () => {
    socket.disconnect();
    console.log("Socket disconnected");
  };
}, [roomId]);


  return (
    <div className="terminal-screen full">
      <div className="terminal-glow" />
      <div className="terminal-window full">
        <div className="terminal-header">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="text-[#00ff66] hover:text-[#33ffaa]"
          >
            <ArrowLeft size={18} /> Back
          </Button>
          <div className="title">Room: {roomId}</div>
        </div>

        <div className="neon-card members-card">
          <h2 className="neon-title">👥 Members</h2>
          <motion.ul layout className="members-list">
            {members.map((m) => (
              <motion.li
                key={m.memberId}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="member-item"
              >
                {m.memberId}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </div>
  );
}
