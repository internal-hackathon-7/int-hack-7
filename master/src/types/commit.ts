export interface CmdDiffBlob {
  commands: CommandEntry[];
}

export interface CommandEntry {
  timestamp: string;
  command: string;
  exit_code: number;
  stderr?: string;
}

export interface DiffBlob {
  project_name: string;
  old_hash: string;
  new_hash: string;
  timestamp: string;
  summary: SummaryInfo;
  changes: FileChange[];
}

export interface SummaryInfo {
  files_changed: number;
  insertions: number;
  deletions: number;
  renames: number;
  copies: number;
}

export interface FileChange {
  action: string;
  old_path?: string;
  new_path?: string;
  old_mode?: string;
  new_mode?: string;
  hash_before?: string;
  hash_after?: string;
  lines_added: number;
  lines_deleted: number;
  patch?: PatchInfo;
}

export interface PatchInfo {
  diff_text: string;
}

export interface CommitPayload {
  emailId: string;
  roomId: string;
  timestamp: string;
  fileDiff: DiffBlob;
  cmdDiff: CmdDiffBlob;
}
