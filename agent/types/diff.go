package types

type DiffBlob struct {
	ProjectName string       `json:"project_name"`
	OldHash     string       `json:"old_hash"`
	NewHash     string       `json:"new_hash"`
	Timestamp   string       `json:"timestamp"`
	Summary     SummaryInfo  `json:"summary"`
	Changes     []FileChange `json:"changes"`
}

type SummaryInfo struct {
	FilesChanged int `json:"files_changed"`
	Insertions   int `json:"insertions"`
	Deletions    int `json:"deletions"`
	Renames      int `json:"renames"`
	Copies       int `json:"copies"`
}

type FileChange struct {
	Action       string     `json:"action"`
	OldPath      *string    `json:"old_path,omitempty"`
	NewPath      *string    `json:"new_path,omitempty"`
	OldMode      string     `json:"old_mode,omitempty"`
	NewMode      string     `json:"new_mode,omitempty"`
	HashBefore   *string    `json:"hash_before,omitempty"`
	HashAfter    *string    `json:"hash_after,omitempty"`
	LinesAdded   int        `json:"lines_added"`
	LinesDeleted int        `json:"lines_deleted"`
	Patch        *PatchInfo `json:"patch,omitempty"`
}

type PatchInfo struct {
	DiffText string `json:"diff_text"`
}
