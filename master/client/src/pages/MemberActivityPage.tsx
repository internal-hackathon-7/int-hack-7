"use client";
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import "./Home.css";

interface SummaryInfo {
  filesChanged: number;
  insertions: number;
  deletions: number;
  renames: number;
  copies: number;
}

interface DiffBlob {
  projectName: string;
  oldHash: string;
  newHash: string;
  timestamp: string;
  summary: SummaryInfo;
}

export default function MemberActivityPage() {
  const { roomId, googleId } = useParams();
  const navigate = useNavigate();
  const [diffData, setDiffData] = useState<DiffBlob[]>([]);
    const [loading, setLoading] = useState(true);
    const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!roomId || !googleId) {
      console.warn("🚫 Missing roomId or googleId");
      return;
    }

    (async () => {
      try {
        console.log(
          "📡 Fetching from:",
          `${API_BASE}/daemon/fetchDiffBlobMember`
        );
        console.log("🧾 Payload:", { roomId, googleId });

        const res = await fetch(`${API_BASE}/daemon/fetchDiffBlobMember`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, googleId }),
        });

        const data = await res.json();
        setDiffData(data || []);

        console.log("📨 Response status:", res.status);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
      } catch (err) {
        console.error("❌ Error fetching diff blobs:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId, googleId]);


  const COLORS = ["#00ff66", "#33ffaa", "#00cc88", "#007755", "#00ffee"];

  // Prepare data for charts
  const summaryData = diffData.map((d) => ({
    project: d.projectName,
    insertions: d.summary.insertions,
    deletions: d.summary.deletions,
    filesChanged: d.summary.filesChanged,
  }));

  const totalSummary = summaryData.reduce(
    (acc, cur) => ({
      insertions: acc.insertions + cur.insertions,
      deletions: acc.deletions + cur.deletions,
      filesChanged: acc.filesChanged + cur.filesChanged,
    }),
    { insertions: 0, deletions: 0, filesChanged: 0 }
  );

  const pieData = [
    { name: "Insertions", value: totalSummary.insertions },
    { name: "Deletions", value: totalSummary.deletions },
    { name: "Files Changed", value: totalSummary.filesChanged },
  ];

  const timelineData = diffData.map((d, i) => ({
    index: i + 1,
    hash: d.newHash.slice(0, 7),
    timestamp: new Date(d.timestamp).toLocaleString(),
    changes: d.summary.insertions - d.summary.deletions,
  }));

  if (loading) {
    return (
      <div className="terminal-screen full flex items-center justify-center text-[#00ff66]">
        Loading member activity...
      </div>
    );
  }

  return (
    <div className="terminal-screen full">
      <div className="terminal-glow" />
      <div className="terminal-window full">
        {/* HEADER */}
        <div className="terminal-header flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="text-[#00ff66] hover:text-[#33ffaa]"
            >
              <ArrowLeft size={18} /> Back
            </Button>
            <h2 className="text-[#00ff66] text-lg font-mono">
              Member Activity:{" "}
              <span className="text-[#33ffaa]">{googleId}</span>
            </h2>
          </div>
        </div>

        {/* DASHBOARD */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* BAR CHART */}
          <motion.div
            className="neon-card p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <h3 className="neon-title mb-2">📊 Project Changes Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summaryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="project" stroke="#00ff66" />
                <YAxis stroke="#00ff66" />
                <Tooltip />
                <Legend />
                <Bar dataKey="insertions" fill="#00ff66" />
                <Bar dataKey="deletions" fill="#ff4444" />
                <Bar dataKey="filesChanged" fill="#33ffaa" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* PIE CHART */}
          <motion.div
            className="neon-card p-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <h3 className="neon-title mb-2">🍩 Overall Contribution Summary</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* TIMELINE GRAPH */}
        <motion.div
          className="neon-card mt-8 p-4 overflow-x-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="neon-title mb-2">🕒 Commit Timeline</h3>
          <div className="min-w-[600px]">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="hash" stroke="#00ff66" />
                <YAxis stroke="#00ff66" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="changes"
                  stroke="#00ff66"
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
