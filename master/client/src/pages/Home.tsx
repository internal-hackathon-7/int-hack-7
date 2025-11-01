"use client";

import React, { useEffect, useRef, useState, type JSX } from "react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import "./Home.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:3000";

interface User {
  name: string;
  email: string;
  picture: string;
}

export default function HomePage(): JSX.Element {
  // ─────────────────────────────── STATE ───────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  // ─────────────────────────────── HELPERS ───────────────────────────────
  const log = (line: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `${time}: ${line}`]);
  };

  const sendWs = (payload: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      log("WebSocket not connected");
    }
  };

  const createRoom = () => sendWs({ type: "create_room" });
  const joinRoom = () => sendWs({ type: "join_room", code: joinCode });

  // ─────────────────────────────── EFFECTS ───────────────────────────────
  useEffect(() => {
    const WS_URL = `${WS_BASE.replace(/^http/, "ws")}/socket`;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "room_created":
            setRoomCode(data.code);
            log(`Room created: ${data.code}`);
            break;
          case "joined_room":
            setRoomCode(data.code);
            log(`Joined room: ${data.code}`);
            break;
          default:
            log(`Message: ${JSON.stringify(data)}`);
        }
      } catch {
        log(`Raw: ${event.data}`);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      log("WebSocket disconnected");
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Not logged in");
        const data = await res.json();
        setUser(data);
      } catch {
        window.location.href = `${location.origin}/`;
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = `${location.origin}/`;
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ─────────────────────────────── RENDER ───────────────────────────────
  if (loading) {
    return (
      <div className="terminal-wrapper">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-10 h-10 border-4 border-t-transparent border-[#00ff66] rounded-full"
        />
      </div>
    );
  }

  if (!user) return <></>;

  return (
    <div className="terminal-screen">
      <div className="terminal-glow" />
      <div className="terminal-window">
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
            className="text-[#00ff66]"
          >
            <LogOut size={18} />
          </Button>
        </div>

        <div className="terminal-body" ref={terminalRef}>
          {/* USER CARD */}
          <div className="user-card neon-card">
            <img src={user.picture} alt={user.name} className="avatar" />
            <div className="user-info">
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          {/* ROOM CONTROLS */}
          <div className="neon-card">
            <h3>Create or Join a Room</h3>
            <Button onClick={createRoom} className="mt-2 neon-btn">
              Create Room
            </Button>

            <div className="mt-3 flex gap-2 justify-center">
              <input
                type="text"
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="bg-black border border-[#00ff66] px-3 py-2 rounded-md text-[#0f0] focus:outline-none"
              />
              <Button onClick={joinRoom} className="neon-btn">
                Join
              </Button>
            </div>

            <p className="hint mt-2">
              WebSocket: {wsConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </p>
            {roomCode && <p className="hint">Room Code: {roomCode}</p>}
          </div>

          {/* LOG TERMINAL */}
          <pre className="prompt-line mt-4 text-[#0f0] text-sm whitespace-pre-wrap">
            <span className="prompt-user">user@neon:~$</span> Logs
            {"\n"}
            {logs.length ? logs.join("\n") : "No logs yet..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
