"use client";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Terminal, FileCode2 } from "lucide-react";
import { Button } from "../components/ui/button";
import "./Home.css"; // reuse same neon/terminal styles
import axios from "axios";
interface DiffBlob {
  _id?: string;
  projectName: string;
  oldHash: string;
  newHash: string;
  timestamp: string;
  summary: SummaryInfo;
  changes?: RawChange[];
}

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

export default function DiffPage() {
  const { roomId, googleId } = useParams();
  const navigate = useNavigate();
  const time = localStorage.getItem("time");
  const path = localStorage.getItem("path");
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const [diffData, setDiffData] = useState<DiffBlob[]>([]);
  const [loading, setLoading] = useState(true);
  const [explanation,setExplanation]=useState("");
  const [selectedFile, setSelectedFile] = useState<RawChange | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<DiffBlob | null>(null);

  useEffect(() => {
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

        const data = (await res.json()) as {
          message: string;
          allTimeStamps: [];
          diffData: DiffBlob[];
        };

        setDiffData(data.diffData || []);
      } catch (err) {
        console.error("❌ Error fetching diff blobs:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId, googleId, API_BASE]);

  // Find commit and file
useEffect(() => {
  if (!loading && diffData.length > 0) {
    // 👇 specify the file you're interested in
    const targetPath = path; // e.g., "src/components/Navbar.tsx"
    const targetTimestamp = time; // optional

    // 🔍 find the diff entry that matches timestamp (if provided)
    const selectedDiff = diffData.find(
      (d) => !targetTimestamp || d.timestamp === targetTimestamp
    );

    if (!selectedDiff?.changes) return;

    // 🔍 find the change object inside `changes` array
    const matchedChange = selectedDiff.changes.find(
      (change) =>
        change.oldPath === targetPath || change.newPath === targetPath
    );

    if (!matchedChange) {
      console.warn("⚠️ No matching path found in diff changes.");
      return;
    }

    // 🧩 Prepare output for that specific change
    const output = [
      {
        action: matchedChange.action || "",
        patch: matchedChange.patch?.diffText || "",
      },
    ];
    setSelectedCommit(selectedDiff);
    setSelectedFile(matchedChange);

    // 🚀 Send it to Flask backend
    (async () => {
      try {
        const res = await axios.post(
          "http://localhost:8000/agent",
          { output },
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true, // only if Flask allows credentials
          }
        );

        setExplanation(res.data.output || "No explanation returned.");
        console.log("✅ Agent response:", res.data);
      } catch (err) {
        console.error("❌ Error sending to agent:", err);
      }
    })();
  }
}, [diffData, loading, path,time]);
  const renderDiff = (text: string) => {
  if (!text) return <div>No diff available</div>;

  const lines = text.split(/\r?\n/);

  return (
    <div className="font-mono text-sm rounded-md overflow-hidden border border-[#00ff66]/30">
      {lines.map((line, i) => {
        if (!line.trim()) return null;

        let bg = "";
        let textColor = "text-[#00ff66]";
        let symbol = " ";
        if (line.startsWith("+") && !line.startsWith("/^\d+[+]/")) {
          bg = "bg-green-900/40";
          textColor = "text-green-400";
          symbol = "+";
        } else if (line.startsWith("-") && !line.startsWith("/^\d+[-]/")) {
          bg = "bg-red-900/40";
          textColor = "text-red-400";
          symbol = "-";
        } else if (line.startsWith("@@")) {
          bg = "bg-blue-900/30";
          textColor = "text-blue-400";
          symbol = "@";
        } else {
          bg = "bg-black";
          textColor = "text-[#00ff66]";
        }

        return (
          <div
            key={i}
            className={`flex items-start px-3 py-[2px] whitespace-pre ${bg} !text-left`}
          >
            <span className="w-10 absolute text-left pr-3 text-gray-600 select-none">
              {i + 1}
            </span>
            <span className={`w-3 text-center ${textColor}`}>{symbol}</span>
            <span className={`pl-2 ${textColor}`}>
              {line.replace(/^(\+|-|@@)/, "")}
            </span>
          </div>
        );
      })}
    </div>
  );
};


  if (loading)
    return (
      <div className="terminal-screen flex items-center justify-center text-[#00ff66]">
        Loading diff...
      </div>
    );

  if (!selectedFile || !selectedCommit)
    return (
      <div className="terminal-screen flex items-center justify-center text-gray-400">
        No file found for {path} at {time}.
      </div>
    );

  return (
    <div className="terminal-screen full">
      <div className="terminal-glow" />
      <div className="terminal-window full p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-[#00ff66]"
          >
            <ArrowLeft size={18} /> Back
          </Button>
          <div className="text-right">
            <div className="font-mono text-[#00ff66] text-sm">
              Room: {roomId}
            </div>
            <div className="text-xs text-gray-400">Member: {googleId}</div>
          </div>
        </div>

        {/* Diff Info */}
        <div className="neon-card p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileCode2 className="text-[#00ff66]" />
            <h2 className="text-lg font-bold text-[#33ffaa]">
              {selectedFile.newPath || selectedFile.oldPath}
            </h2>
          </div>
          <div className="text-sm text-gray-400 mb-3">
            Action: {selectedFile.action} | +{selectedFile.linesAdded ?? 0} / -
            {selectedFile.linesDeleted ?? 0}
          </div>
          <div className="mt-4">
            {selectedFile.patch?.diffText
              ? renderDiff(selectedFile.patch.diffText)
              : "No diff available"}
          </div>
        </div>

        {/* Bash Commands Section */}
        <div className="neon-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="text-[#00ff66]" />
            <h3 className="text-[#33ffaa] font-semibold">
              Bash Commands Executed
            </h3>
          </div>
          <div className="bg-[#000] p-3 rounded font-mono text-[#00ff66] text-sm whitespace-pre-wrap">
            {`git add ${selectedFile.newPath || selectedFile.oldPath}
git commit -m "Updated ${selectedFile.newPath || selectedFile.oldPath}"
git push`}
          </div>
        </div>

        {/* Explanation Section */}
        <div className="neon-card p-4">
          <h3 className="text-[#33ffaa] font-semibold mb-2">Explanation</h3>
          <p className="text-sm text-gray-300 leading-relaxed">
           {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
