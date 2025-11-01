// src/pages/MemberActivityPage.tsx
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
import { ArrowLeft, Folder, FolderOpen, FileCode2, Clock1 } from "lucide-react";
import { Button } from "../components/ui/button";
import "./Home.css"; // keeps your neon styles

// --- Types (match your backend) ---
interface SummaryInfo {
  filesChanged: number;
  insertions: number;
  deletions: number;
  renames: number;
  copies: number;
}

interface RawChange {
  action?: string;
  oldPath?: string;
  newPath?: string;
  linesAdded?: number;
  linesDeleted?: number;
  patch?: { diffText?: string };
}

interface DiffBlob {
  _id?: string;
  projectName: string;
  oldHash: string;
  newHash: string;
  timestamp: string; // or ISODate string
  summary: SummaryInfo;
  changes?: RawChange[];
}

// --- Component ---
export default function MemberActivityPage() {
  const { roomId, googleId } = useParams();
  const navigate = useNavigate();
  const [diffData, setDiffData] = useState<DiffBlob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null); // _id
  const [openDiff, setOpenDiff] = useState<{
    title: string;
    text: string;
  } | null>(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  // fetch all timestamps (all diffs) for this member + room
  useEffect(() => {
    if (!roomId || !googleId) {
      console.warn("🚫 Missing roomId or googleId");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/daemon/fetchDiffBlobMember`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, googleId }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const data = (await res.json()) as DiffBlob[]; // expecting array of diff docs
        setDiffData(data || []);
      } catch (err) {
        console.error("❌ Error fetching diff blobs:", err);
        setDiffData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId, googleId, API_BASE]);

  // --- small charts data ---
  const summaryData = diffData.map((d) => ({
    project: d.projectName,
    insertions: d.summary?.insertions ?? 0,
    deletions: d.summary?.deletions ?? 0,
    filesChanged: d.summary?.filesChanged ?? 0,
  }));

  const totalSummary = summaryData.reduce(
    (acc, cur) => ({
      insertions: acc.insertions + (cur.insertions || 0),
      deletions: acc.deletions + (cur.deletions || 0),
      filesChanged: acc.filesChanged + (cur.filesChanged || 0),
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
    hash: (d.newHash || "").slice(0, 7),
    timestamp: new Date(d.timestamp).toLocaleString(),
    insertions: d.summary?.insertions ?? 0,
    deletions: d.summary?.deletions ?? 0,
    filesChanged: d.summary?.filesChanged ?? 0,
  }));

  // helper: readable timestamp label
  const tsLabel = (t?: string) =>
    t ? new Date(t).toLocaleString() : "unknown time";

  // render commit list (vertical)
  const CommitCard: React.FC<{ commit: DiffBlob }> = ({ commit }) => {
    const id = commit._id ?? `${commit.newHash}-${commit.timestamp}`;
    const isOpen = expandedCommit === id;
    const files = commit.changes || [];

    return (
      <div className="neon-card my-3 p-3" style={{ overflow: "visible" }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock1 className="text-[#00ff66]" />
              <div className="font-mono text-sm">
                {tsLabel(commit.timestamp)}
              </div>
            </div>

            <div className="ml-2 text-xs text-gray-300">
              <div>
                project:{" "}
                <strong className="text-[#33ffaa]">{commit.projectName}</strong>
              </div>
              <div className="mt-1">
                hash: <code>{(commit.newHash || "").slice(0, 10)}</code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-[#00ff66]">
              +{commit.summary?.insertions ?? 0}
            </div>
            <div className="text-xs font-mono text-[#ff6666]">
              -{commit.summary?.deletions ?? 0}
            </div>
            <div className="text-xs font-mono text-[#33ffaa]">
              {commit.summary?.filesChanged ?? 0} files
            </div>

            <Button
              onClick={() => setExpandedCommit(isOpen ? null : id)}
              variant="ghost"
              className="text-[#00ff66]"
            >
              {isOpen ? "Collapse" : "Show files"}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-3"
            >
              <div className="border-t border-[#222] pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* left: files list */}
                <div>
                  <h4 className="neon-title mb-2">Changed Files</h4>
                  <div className="space-y-1">
                    {files.length === 0 && (
                      <div className="text-sm text-gray-400">No files</div>
                    )}
                    {files.map((f: RawChange, idx: number) => {
                      const path = f.newPath || f.oldPath || "unknown";
                      const action = f.action || "modified";
                      const badgeColor =
                        action === "added"
                          ? "bg-green-600"
                          : action === "deleted"
                            ? "bg-red-600"
                            : action === "renamed"
                              ? "bg-blue-600"
                              : "bg-yellow-600";
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-[#071007] cursor-pointer"
                          onClick={() =>
                            setOpenDiff({
                              title: path,
                              text:
                                f.patch?.diffText ??
                                `No unified diff available — action: ${action}`,
                            })
                          }
                        >
                          <div className="flex items-center gap-3">
                            <FileCode2 className="text-[#00ff66]" />
                            <div className="font-mono text-sm">
                              {path.split("/").slice(-1)[0]}
                              <div className="text-xs text-gray-500">
                                {path}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className={`text-xs px-2 py-1 rounded ${badgeColor} text-white`}
                            >
                              {action}
                            </div>
                            <div className="text-xs text-gray-400">
                              +{f.linesAdded ?? 0} / -{f.linesDeleted ?? 0}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* right: summary + small charts */}
                <div>
                  <h4 className="neon-title mb-2">Commit Summary</h4>

                  <div className="neon-card p-3 mb-3">
                    <div className="font-mono text-sm">
                      <div>
                        Insertions:{" "}
                        <strong className="text-[#00ff66]">
                          {commit.summary?.insertions ?? 0}
                        </strong>
                      </div>
                      <div>
                        Deletions:{" "}
                        <strong className="text-[#ff6666]">
                          {commit.summary?.deletions ?? 0}
                        </strong>
                      </div>
                      <div>
                        Files changed:{" "}
                        <strong className="text-[#33ffaa]">
                          {commit.summary?.filesChanged ?? 0}
                        </strong>
                      </div>
                      <div>
                        Renames: <strong>{commit.summary?.renames ?? 0}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            key: "insertions",
                            value: commit.summary?.insertions ?? 0,
                          },
                          {
                            key: "deletions",
                            value: commit.summary?.deletions ?? 0,
                          },
                          {
                            key: "files",
                            value: commit.summary?.filesChanged ?? 0,
                          },
                        ]}
                      >
                        <CartesianGrid stroke="#111" />
                        <XAxis dataKey="key" stroke="#00ff66" />
                        <YAxis stroke="#00ff66" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#00ff66" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // color-coded diff renderer
  const renderDiff = (text: string) => {
    const lines = text.split(/\r?\n/);
    return lines.map((line, i) => {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        return (
          <div key={i} className="text-green-400 font-mono whitespace-pre">
            {line}
          </div>
        );
      }
      if (line.startsWith("-") && !line.startsWith("---")) {
        return (
          <div key={i} className="text-red-400 font-mono whitespace-pre">
            {line}
          </div>
        );
      }
      if (line.startsWith("@@")) {
        return (
          <div key={i} className="text-blue-300 font-mono whitespace-pre">
            {line}
          </div>
        );
      }
      // file header lines like --- a/... or +++ b/...
      if (line.startsWith("+++ ") || line.startsWith("--- ")) {
        return (
          <div key={i} className="text-gray-300 font-mono whitespace-pre">
            {line}
          </div>
        );
      }
      return (
        <div key={i} className="text-[#c7f7d1] font-mono whitespace-pre">
          {line}
        </div>
      );
    });
  };

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
      <div
        className="terminal-window full"
        style={{ padding: 20, overflow: "auto", maxHeight: "100vh" }}
      >
        {/* header */}
        <div className="terminal-header flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              className="text-[#00ff66] hover:text-[#33ffaa]"
            >
              <ArrowLeft size={18} /> Back
            </Button>
            <div className="title">
              Member Activity —{" "}
              <span className="text-[#33ffaa] font-mono">{googleId}</span>
              <div className="text-xs text-gray-400">Room: {roomId}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm font-mono text-[#00ff66]">
              Commits: <strong>{diffData.length}</strong>
            </div>
            <div className="neon-card px-3 py-2">
              <div className="text-xs">Total</div>
              <div className="text-sm">
                +{totalSummary.insertions} / -{totalSummary.deletions} ·{" "}
                {totalSummary.filesChanged} files
              </div>
            </div>
          </div>
        </div>

        {/* layout: left timeline, right big charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: timeline list */}
          <div className="col-span-1">
            <h3 className="neon-title mb-3">🕒 Commits (all timestamps)</h3>
            <div className="space-y-2">
              {diffData.length === 0 && (
                <div className="text-sm text-gray-400">No commits found</div>
              )}
              {diffData.map((c) => (
                <CommitCard key={c._id ?? c.timestamp} commit={c} />
              ))}
            </div>
          </div>

          {/* Middle & Right: summary & timeline chart */}
          <div className="col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="neon-card p-4">
                <h4 className="neon-title mb-2">📊 Projects Overview</h4>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryData}>
                      <CartesianGrid stroke="#111" />
                      <XAxis dataKey="project" stroke="#00ff66" />
                      <YAxis stroke="#00ff66" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="insertions" fill="#00ff66" />
                      <Bar dataKey="deletions" fill="#ff4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="neon-card p-4">
                <h4 className="neon-title mb-2">🍩 Overall</h4>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={pieData}
                        outerRadius={70}
                        label
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={["#00ff66", "#ff6666", "#33ffaa"][i % 3]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="neon-card mt-4 p-4">
              <h4 className="neon-title mb-2">📈 Commit Timeline (changes)</h4>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid stroke="#111" />
                    <XAxis dataKey="hash" stroke="#00ff66" />
                    <YAxis stroke="#00ff66" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="changes"
                      data={timelineData.map((t) => ({
                        changes: t.insertions - t.deletions,
                        hash: t.hash,
                      }))}
                      stroke="#00ff66"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diff modal */}
      <AnimatePresence>
        {openDiff && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#0b0b0b] border border-[#00ff66] rounded-xl w-[90%] max-w-4xl max-h-[85vh] overflow-auto p-4"
              initial={{ scale: 0.95, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -10 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-gray-400">File</div>
                  <div className="text-[#33ffaa] font-mono">
                    {openDiff.title}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setOpenDiff(null)}
                    className="text-[#ff6666]"
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="bg-[#000] p-3 rounded-md text-sm font-mono whitespace-pre-wrap">
                {renderDiff(openDiff.text)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
