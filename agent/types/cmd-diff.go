package types

import "time"

type CmdDiffBlob struct {
	// SessionID string         `json:"session_id"`
	// User      string         `json:"user"`
	Commands []CommandEntry `json:"commands"`
}

type CommandEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Command   string    `json:"command"`
	ExitCode  int       `json:"exit_code"`
	Stderr    *string   `json:"stderr,omitempty"`
}
