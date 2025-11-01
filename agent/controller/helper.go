package controller

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-git/go-git/v5/plumbing"
	lib "github.com/internal-hackathon-7/int-hack-7/agent/lib/git"
)

func GetLastHash(projectPath string) (string, error) {
	stateFile := filepath.Join(projectPath, ".daemon", "state.txt")

	f, err := os.Open(stateFile)
	if err != nil {
		// File not found or unreadable — fallback to ZeroHash
		return plumbing.ZeroHash.String(), nil
	}
	defer f.Close()

	var lastLine string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			lastLine = line
		}
	}

	if err := scanner.Err(); err != nil {
		return plumbing.ZeroHash.String(), nil
	}

	if lastLine == "" {
		return plumbing.ZeroHash.String(), nil
	}

	parts := strings.Fields(lastLine)
	if len(parts) < 2 {
		return plumbing.ZeroHash.String(), nil
	}

	hash := strings.TrimSpace(parts[len(parts)-1])
	if hash == "" {
		return plumbing.ZeroHash.String(), nil
	}

	return hash, nil
}

func GetNewHash(projectPath string) (string, error) {
	hash, err := lib.CommitSnapshot(projectPath)
	if err != nil {
		return plumbing.ZeroHash.String(), fmt.Errorf("error taking the snapshot : %v", err)
	}
	return hash.String(), nil
}
