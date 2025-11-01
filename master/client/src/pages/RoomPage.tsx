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
  memberId: string; // Google sub
}

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("session_token");
    if (!token) {
      console.warn("⚠️ No token found, redirecting...");
      navigate("/");
      return;
    }

    const s = io(WS_BASE, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
    });

    setSocket(s);

    s.on("connect", () => {
      setConnected(true);
      console.log("✅ Connected to server");
      if (roomId) {
        s.emit("join_room", roomId);
        console.log(`Joining room ${roomId}`);
      }
    });

    s.on("members_update", (list: Member[]) => {
      console.log("📜 Members update:", list);
      setMembers(list);
    });

    s.on("disconnect", () => {
      setConnected(false);
      console.log("🔴 Disconnected");
    });

    s.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    return () => {
      s.disconnect();
      console.log("Socket disconnected");
    };
  }, [roomId, navigate]);

  return (
    <div className="terminal-screen full">
      <div className="terminal-glow" />
      <div className="terminal-window full">
        {/* HEADER */}
        <div className="terminal-header">
          <Button
            onClick={() => navigate("/home")}
            variant="ghost"
            className="text-[#00ff66] hover:text-[#33ffaa]"
          >
            <ArrowLeft size={18} /> Back
          </Button>
          <div className="title">
            Room: {roomId}{" "}
            <span className={connected ? "text-green-400" : "text-red-400"}>
              {connected ? "● Connected" : "○ Offline"}
            </span>
          </div>
        </div>

        {/* MEMBERS LIST */}
        <div className="neon-card members-card">
          <h2 className="neon-title">👥 Members</h2>
          <motion.ul layout className="members-list">
            {members.length === 0 ? (
              <p>No members yet...</p>
            ) : (
              members.map((m) => (
                <motion.li
                  key={m.memberId}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="member-item flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm text-white">
                    {m.memberId.slice(0, 3)}...
                  </div>
                  <span className="text-sm text-gray-300">
                    {m.memberId}
                  </span>
                </motion.li>
              ))
            )}
          </motion.ul>
        </div>
      </div>
    </div>
  );
}
