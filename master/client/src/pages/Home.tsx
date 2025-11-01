"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  type JSX,
} from "react";
import { io, Socket } from "socket.io-client";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "http://localhost:3000";

declare global {
  interface Window {
    globalSocket?: Socket;
  }
}

interface User {
  name: string;
  email: string;
  picture: string;
  sub?: string; // googleId
}

interface Room {
  roomId: string;
  members: string[];
}

export default function HomePage(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomsJoined, setRoomsJoined] = useState<Room[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const terminalRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // 🧾 log helper
  const log = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  }, []);

  // 🧭 Save token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("session_token", token);
      window.history.replaceState({}, document.title, "/home");
    }
  }, []);

  // 🧠 Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Not logged in");
        const data = await res.json();
        if (data?.sub) localStorage.setItem("member_id", data.sub);
        setUser(data);
      } catch {
        window.location.href = `${location.origin}/`;
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 🔌 Connect socket globally AFTER user
  useEffect(() => {
    if (!user?.sub) return;

    if (!window.globalSocket) {
      const token = localStorage.getItem("session_token");
      if (!token) return log("⚠️ No session token found.");

      const socket = io(WS_BASE, {
        transports: ["websocket"],
        withCredentials: true,
        auth: { token },
        autoConnect: true,
        reconnection: true,
      });

      window.globalSocket = socket;

      socket.on("connect", () => {
        setSocketConnected(true);
        log(`✅ Connected as Google user: ${user.sub}`);
      });

      socket.on("disconnect", () => {
        setSocketConnected(false);
        log("🔴 Disconnected from server");
      });

      socket.on("room_created", ({ roomId, memberId }) => {
        setRoomCode(roomId);
        log(`🏠 Room created: ${roomId} | Google sub: ${memberId}`);
        navigate(`/room/${roomId}`);
      });

      socket.on("error_message", (msg: string) => {
        log(`⚠️ Error: ${msg}`);
      });
    } else {
      setSocketConnected(window.globalSocket.connected);
      log("♻️ Reusing existing socket connection");
    }
  }, [user?.sub, log, navigate]);

  // 🧩 Fetch rooms joined by this user
  useEffect(() => {
    if (!user?.sub) return;

    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE}/daemon/roomsJoined`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleId: user.sub }),
        });

        const data = await res.json();
        if (res.ok) {
          setRoomsJoined(data.rooms || []);
          log(`📦 Loaded ${data.rooms?.length || 0} joined rooms`);
        } else {
          log(`⚠️ Could not fetch rooms: ${data.error}`);
        }
      } catch (err) {
        log(`❌ Error fetching rooms: ${err}`);
      }
    };

    fetchRooms();
  }, [user?.sub, log]);

  const createRoom = () => {
    if (!window.globalSocket) return log("⚠️ Not connected to server");
    window.globalSocket.emit("create_room");
  };

  const handleLogout = async () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("member_id");
    window.globalSocket?.disconnect();
    window.globalSocket = undefined;

    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = `${location.origin}/`;
  };

  if (loading)
    return (
      <div className="terminal-wrapper">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-10 h-10 border-4 border-t-transparent border-[#00ff66] rounded-full"
        />
      </div>
    );

  if (!user) return <></>;

  return (
    <div className="terminal-screen full">
      <div className="terminal-glow" />
      <div className="terminal-window full">
        <div className="terminal-header">
          <div className="dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>

          <div className="title">user@neon-terminal:~</div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-[#00ff66] hover:text-[#33ffaa] transition"
          >
            <LogOut size={18} />
          </Button>
        </div>

        <div className="terminal-body-grid" ref={terminalRef}>
          {/* User Info */}
          <div className="user-card neon-card">
            <img src={user.picture} alt={user.name} className="avatar" />
            <div className="user-info">
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          {/* Rooms Joined */}
          <div className="neon-card">
            <h3 className="neon-title">💬 Joined Rooms</h3>

            {roomsJoined.length === 0 ? (
              <p className="text-sm text-gray-400">No rooms joined yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {roomsJoined.map((room) => (
                  <div
                    key={room.roomId}
                    onClick={() => navigate(`/room/${room.roomId}`)}
                    className="room-box"
                  >
                    <div className="room-arrow" />
                    <div className="room-content">
                      <p className="room-id">💾 {room.roomId}</p>
                      <p className="room-members">
                        👥 {room.members.length} member
                        {room.members.length !== 1 && "s"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Room */}
          <div className="neon-card room-control">
            <h3 className="neon-title">⚡ Create a New Room</h3>

            <div className="command-buttons">
              <Button
                onClick={createRoom}
                className="neon-btn wide-btn create-btn"
              >
                Create Room
              </Button>
            </div>

            <div className="status-bar">
              <span
                className={`status-dot ${
                  socketConnected ? "online" : "offline"
                }`}
              />
              <span className="status-text">
                {socketConnected ? "Connected" : "Disconnected"}
              </span>
              {roomCode && (
                <span className="room-code">
                  Room ID: <strong>{roomCode}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="neon-terminal-logs">
            <div className="terminal-header-bar">📜 Live Logs</div>
            <pre className="terminal-log-output">
              {logs.length ? logs.join("\n") : "No logs yet..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
