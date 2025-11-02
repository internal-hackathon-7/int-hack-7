package types

import "time"

type LoginPayload struct {
	RoomID string `json:"roomId"`
	Email  string `json:"gmail"`
}

type CommitPayload struct {
	EmailID   string      `json:"emailId"`
	RoomID    string      `json:"roomId"`
	TimeStamp time.Time   `json:"timestamp"`
	FileDiff  DiffBlob    `json:"fileDiff"`
	CmdDiff   CmdDiffBlob `json:"cmdDiff"`
}
