"use client";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Folder, FolderOpen, FileCode2 } from "lucide-react";
import { Button } from "../components/ui/button";
import "./Home.css";

interface SummaryInfo {
  filesChanged: number;
  insertions: number;
  deletions: number;
  renames: number;
  copies: number;
}

interface FileChange {
  filePath: string;
  changes: string;
}

interface DiffBlob {
  projectName: string;
  oldHash: string;
  newHash: string;
  timestamp: string;
  summary: SummaryInfo;
  changes?: any[];
}

interface TreeNode {
  name: string;
  type: "folder" | "file";
  action?: string;
  children?: TreeNode[];
  content?: string;
}

export default function MemberActivityPage() {
  const { roomId, googleId } = useParams();
  const navigate = useNavigate();
  const [diffData, setDiffData] = useState<DiffBlob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileChange | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!roomId || !googleId) {
      console.warn("🚫 Missing roomId or googleId");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/daemon/fetchDiffBlobMember`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, googleId }),
        });
        const data = await res.json();
        setDiffData(data || []);
      } catch (err) {
        console.error("❌ Error fetching diff blobs:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId, googleId]);

  const COLORS = ["#00ff66", "#33ffaa", "#00cc88", "#007755", "#00ffee"];

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

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const buildTree = (changes: any[]): TreeNode[] => {
    const root: Record<string, any> = {};
    for (const file of changes) {
      const filePath = file.newPath || file.oldPath;
      if (!filePath) continue;
      const parts = filePath.split("/");
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {
            name: part,
            type: i === parts.length - 1 ? "file" : "folder",
            action: file.action,
            ...(i === parts.length - 1
              ? { content: file.patch?.diffText }
              : { children: {} }),
          };
        }
        if (i < parts.length - 1) current = current[part].children;
      }
    }

    const toArray = (obj: Record<string, any>): TreeNode[] =>
      Object.values(obj).map((node) =>
        node.type === "folder"
          ? { ...node, children: toArray(node.children || {}) }
          : node
      );

    return toArray(root);
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case "added":
        return "text-green-400";
      case "modified":
        return "text-yellow-400";
      case "deleted":
        return "text-red-400";
      case "renamed":
        return "text-blue-400";
      default:
        return "text-[#00ff66]";
    }
  };

  // 🌳 Improved Tree Rendering
  const renderTree = (nodes: TreeNode[], depth = 0, basePath = "") => (
    <div className="ml-4 border-l border-[#1f1f1f] pl-4">
      {nodes.map((node, index) => {
        const fullPath = `${basePath}/${node.name}`;
        const isExpanded = expandedFolders[fullPath];

        return (
          <motion.div
            key={fullPath}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="relative group"
          >
            <div className="absolute left-[-18px] top-0 h-full border-l border-[#1f1f1f]" />
            {node.type === "folder" ? (
              <div>
                <div
                  className="flex items-center gap-2 cursor-pointer text-[#33ffaa] hover:text-[#00ff66] transition-all"
                  onClick={() => toggleFolder(fullPath)}
                >
                  {isExpanded ? (
                    <FolderOpen size={16} className="text-[#00ff66]" />
                  ) : (
                    <Folder size={16} className="text-[#33ffaa]" />
                  )}
                  <span className="font-mono text-sm">{node.name}</span>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-6 border-l border-[#222] pl-3 mt-1"
                    >
                      {node.children &&
                        renderTree(node.children, depth + 1, fullPath)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.03, x: 3 }}
                onClick={() =>
                  setSelectedFile({
                    filePath: fullPath,
                    changes: node.content || "No diff available",
                  })
                }
                className={`flex items-center gap-2 pl-2 py-1 cursor-pointer rounded-md transition-all duration-150 ${getActionColor(
                  node.action
                )} hover:bg-[#0a0a0a] hover:shadow-[0_0_5px_#00ff66]/40`}
              >
                <FileCode2 size={14} />
                <span className="font-mono text-sm">{node.name}</span>
                {node.action && (
                  <span className="text-xs text-gray-500 ml-2 italic">
                    ({node.action})
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );

  if (loading)
    return (
      <div className="terminal-screen full flex items-center justify-center text-[#00ff66]">
        Loading member activity...
      </div>
    );

  const lastChanges = diffData[0]?.changes || [];

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

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <motion.div className="neon-card p-4" whileHover={{ scale: 1.02 }}>
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

          <motion.div className="neon-card p-4" whileHover={{ scale: 1.02 }}>
            <h3 className="neon-title mb-2">🍩 Overall Contribution Summary</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
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
        </div>

        {/* TIMELINE */}
        <motion.div className="neon-card mt-8 p-4 overflow-x-auto">
          <h3 className="neon-title mb-3">🕒 Commit Timeline</h3>
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

          {/* Avatars */}
          <div className="flex items-center gap-8 mt-6 justify-center overflow-x-auto">
            {timelineData.map((commit, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center relative group"
                whileHover={{ scale: 1.15 }}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${googleId}&background=00ff66&color=000&bold=true`}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border border-[#00ff66] shadow-lg"
                />
                <div className="w-[2px] h-8 bg-[#00ff66]" />
                <div className="text-[#33ffaa] text-xs font-mono">
                  {commit.hash}
                </div>
                <div className="absolute bottom-[-60px] hidden group-hover:block bg-[#000] border border-[#00ff66] rounded-md px-3 py-2 text-xs text-[#00ff66] whitespace-nowrap shadow-lg">
                  <div>{commit.timestamp}</div>
                  <div>Δ {commit.changes} lines</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FILE TREE */}
        <motion.div className="neon-card mt-8 p-4">
          <h3 className="neon-title mb-2">📁 Changed Files Tree</h3>
          {lastChanges.length > 0 ? (
            <div className="font-mono text-sm">
              {renderTree(buildTree(lastChanges))}
            </div>
          ) : (
            <p className="text-gray-500">No file changes recorded.</p>
          )}
        </motion.div>
      </div>

      {/* DIFF POPUP */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#111] border border-[#00ff66] rounded-xl p-4 w-[80%] max-h-[80%] overflow-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[#00ff66] font-mono text-lg">
                  {selectedFile.filePath}
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedFile(null)}
                  className="text-[#ff4444]"
                >
                  Close
                </Button>
              </div>
              <pre className="text-sm font-mono whitespace-pre-wrap bg-[#000] p-3 rounded-md overflow-x-auto">
                {selectedFile.changes.split("\n").map((line, i) => {
                  if (line.startsWith("+"))
                    return (
                      <div key={i} className="text-green-400">
                        {line}
                      </div>
                    );
                  if (line.startsWith("-"))
                    return (
                      <div key={i} className="text-red-400">
                        {line}
                      </div>
                    );
                  return <div key={i}>{line}</div>;
                })}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
