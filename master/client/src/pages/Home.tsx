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

interface User {
  name: string;
  email: string;
  picture: string;
  sub?: string;
}

export default function HomePage(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
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

  // 🧠 Fetch user first
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

  // 🔌 Connect socket AFTER we know the user
  useEffect(() => {
    if (!user?.sub) return;
    const token = localStorage.getItem("session_token");
    if (!token) {
      log("⚠️ No session token found.");
      return;
    }

    const socket = io(WS_BASE, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      log(`✅ Connected as Google user: ${user.sub}`);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      log("🔴 Disconnected from server");
    });

    socket.on("connect_error", (err) => {
      log(`❌ Connection error: ${err.message}`);
    });

    socket.on("room_created", ({ roomId, memberId }) => {
      setRoomCode(roomId);
      log(`🏠 Room created: ${roomId} | Google sub: ${memberId}`);
      navigate(`/room/${roomId}`);
    });

    socket.on("room_joined", ({ roomId, memberId }) => {
      setRoomCode(roomId);
      log(`🙋 Joined Room: ${roomId} | Google sub: ${memberId}`);
      navigate(`/room/${roomId}`);
    });

    socket.on("member_joined", ({ roomId, memberId }) => {
      log(`🧩 New member joined room ${roomId}: ${memberId}`);
    });

    socket.on("error_message", (msg: string) => {
      log(`⚠️ Error: ${msg}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.sub, log, navigate]);

  // 🖥️ Scroll logs automatically
  useEffect(() => {
    const t = terminalRef.current;
    if (t) t.scrollTop = t.scrollHeight;
  }, [logs]);

  const createRoom = () => {
    if (!socketRef.current) return log("⚠️ Not connected to server");
    socketRef.current.emit("create_room");
  };

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return log("⚠️ Enter a valid room code");
    if (!socketRef.current) return log("⚠️ Not connected to server");
    socketRef.current.emit("join_room", code);
  };

  const handleLogout = async () => {
    localStorage.removeItem("session_token");
    localStorage.removeItem("member_id");
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
          <div className="user-card neon-card">
            <img src={user.picture} alt={user.name} className="avatar" />
            <div className="user-info">
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="neon-card room-control">
            <h3 className="neon-title">⚡ Create or Join a Room</h3>

            <div className="command-buttons">
              <Button
                onClick={createRoom}
                className="neon-btn wide-btn create-btn"
              >
                Create Room
              </Button>

              <div className="mt-3 flex gap-2 justify-center">
                <input
                  type="text"
                  placeholder="Enter room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="join-input"
                />
                <Button onClick={joinRoom} className="neon-btn join-btn">
                  Join
                </Button>
              </div>
            </div>

            <div className="status-bar">
              <span
                className={`status-dot ${socketConnected ? "online" : "offline"}`}
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
