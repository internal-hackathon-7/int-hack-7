import mongoose, { Schema, Document } from "mongoose";

// --- Subschemas ---

const PatchInfoSchema = new Schema({
  diff_text: { type: String },
});

const FileChangeSchema = new Schema({
  action: { type: String },
  old_path: { type: String },
  new_path: { type: String },
  old_mode: { type: String },
  new_mode: { type: String },
  hash_before: { type: String },
  hash_after: { type: String },
  lines_added: { type: Number },
  lines_deleted: { type: Number },
  patch: { type: PatchInfoSchema },
});

const SummaryInfoSchema = new Schema({
  files_changed: { type: Number },
  insertions: { type: Number },
  deletions: { type: Number },
  renames: { type: Number },
  copies: { type: Number },
});

const DiffBlobSchema = new Schema({
  project_name: { type: String, required: true },
  old_hash: { type: String, required: true },
  new_hash: { type: String, required: true },
  timestamp: { type: String },
  summary: { type: SummaryInfoSchema },
  changes: { type: [FileChangeSchema] },
});

const CommandEntrySchema = new Schema({
  timestamp: { type: String },
  command: { type: String },
  exit_code: { type: Number },
  stderr: { type: String },
});

const CmdDiffBlobSchema = new Schema({
  commands: { type: [CommandEntrySchema] },
});

// --- Main Schema ---

const CommitPayloadSchema = new Schema({
  emailId: { type: String, required: true },
  roomId: { type: String, required: true },
  timestamp: { type: String, required: true },
  fileDiff: { type: DiffBlobSchema },
  cmdDiff: { type: CmdDiffBlobSchema },
});

// --- Model ---

export interface ICommitPayload extends Document {
  emailId: string;
  roomId: string;
  timestamp: string;
  fileDiff?: typeof DiffBlobSchema;
  cmdDiff?: typeof CmdDiffBlobSchema;
}

export const CommitPayloadModel = mongoose.model<ICommitPayload>(
  "CommitPayload",
  CommitPayloadSchema
);
