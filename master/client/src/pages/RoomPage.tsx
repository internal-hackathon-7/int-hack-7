"use client";
import React, { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut } from "lucide-react";
import "./Home.css";

interface Member {
  memberId: string;
}

declare global {
  interface Window {
    globalSocket?: Socket;
  }
}

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = window.globalSocket;

    if (!s) {
      console.warn("⚠️ No global socket found, redirecting to home...");
      navigate("/home");
      return;
    }

    setSocket(s);
    setConnected(s.connected);

    // 🧩 Join the room when component mounts
    if (roomId) {
      console.log(`📡 Joining room ${roomId}`);
      s.emit("join_room", roomId);
    }

    // 🧭 Listen for member updates
    s.on("members_update", (list: Member[]) => {
      console.log("📜 Members update:", list);
      setMembers(list);
    });

    // 🧲 Handle connection status
    const handleConnect = () => {
      console.log("✅ Socket reconnected");
      setConnected(true);
      // Auto-rejoin if reconnected
      if (roomId) {
        console.log(`🔁 Rejoining room ${roomId}`);
        s.emit("join_room", roomId);
      }
    };

    const handleDisconnect = () => {
      console.log("🔴 Socket disconnected");
      setConnected(false);
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);

    return () => {
      // ❌ Do NOT emit leave_room when navigating away
      // This prevents removing the member from the room
      console.log(`🏁 Unmounting RoomPage for ${roomId}`);
      s.off("members_update");
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
    };
  }, [roomId, navigate]);

  const handleBack = () => {
    // just navigate — don't emit leave_room
    navigate("/home");
  };

  const handleLeaveRoom = () => {
    if (socket && roomId) {
      socket.emit("leave_room", roomId);
      console.log(`👋 User manually left room ${roomId}`);
    }
    navigate("/home");
  };

  const handleLogout = async () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("member_id");
    window.globalSocket?.disconnect();
    window.globalSocket = undefined;
    navigate("/");
  };

  return (
    <div className="terminal-screen full">
      <div className="terminal-glow" />
      <div className="terminal-window full">
        {/* HEADER */}
        <div className="terminal-header flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBack}
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

          <div className="flex gap-2">
            <Button
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Leave Room
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-[#00ff66] hover:text-[#33ffaa]"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>

        {/* MEMBERS LIST */}
        <div className="neon-card members-card mt-4">
          <h2 className="neon-title">👥 Members</h2>
          <motion.ul layout className="members-list">
            {members.length === 0 ? (
              <p className="text-gray-400 text-sm">No members yet...</p>
            ) : (
              members.map((m) => (
                <motion.li
                  key={m.memberId}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="member-item flex items-center gap-3 cursor-pointer hover:bg-green-900/20 transition-all p-2 rounded-lg"
                  onClick={() =>
                    navigate(`/room/${roomId}/member/${m.memberId}`)
                  }
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm text-white">
                    {m.memberId.slice(0, 3)}...
                  </div>
                  <span className="text-sm text-gray-300">{m.memberId}</span>
                </motion.li>
              ))
            )}
          </motion.ul>
        </div>
      </div>
    </div>
  );
}
