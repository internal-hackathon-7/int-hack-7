import mongoose, { Schema, Document } from "mongoose";

interface PatchInfo {
  diffText: string;
}

interface FileChange {
  action: string;
  oldPath?: string;
  newPath?: string;
  oldMode?: string;
  newMode?: string;
  hashBefore?: string;
  hashAfter?: string;
  linesAdded: number;
  linesDeleted: number;
  patch?: PatchInfo;
}

interface SummaryInfo {
  filesChanged: number;
  insertions: number;
  deletions: number;
  renames: number;
  copies: number;
}

export interface DiffBlob extends Document {
  roomId: string;
  memberId: string;
  projectName: string;
  oldHash: string;
  newHash: string;
  timestamp: Date;
  summary: SummaryInfo;
  changes: FileChange[];
}

const PatchSchema = new Schema<PatchInfo>({
  diffText: { type: String },
});

const FileChangeSchema = new Schema<FileChange>({
  action: { type: String, required: true },
  oldPath: String,
  newPath: String,
  oldMode: String,
  newMode: String,
  hashBefore: String,
  hashAfter: String,
  linesAdded: Number,
  linesDeleted: Number,
  patch: PatchSchema,
});

const SummarySchema = new Schema<SummaryInfo>({
  filesChanged: Number,
  insertions: Number,
  deletions: Number,
  renames: Number,
  copies: Number,
});

const DiffBlobSchema = new Schema<DiffBlob>({
  roomId: { type: String, required: true, index: true },
  memberId: { type: String, required: true, index: true },
  projectName: { type: String, required: true },
  oldHash: String,
  newHash: String,
  timestamp: { type: Date, default: Date.now },
  summary: SummarySchema,
  changes: [FileChangeSchema],
});

export const DiffBlobModel = mongoose.model<DiffBlob>(
  "DiffBlob",
  DiffBlobSchema
);
