package lib

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/internal-hackathon-7/int-hack-7/agent/types"
	"github.com/internal-hackathon-7/int-hack-7/agent/utils"
	"gopkg.in/yaml.v3"
)

func DiffCmdHistory(projectPath string, currentHistory string) (types.CmdDiffBlob, error) {
	var diff types.CmdDiffBlob

	var oldHistory string

	oldHistory, _ = FindOldHistoryFile(projectPath)

	data, err := ParseHistoryDiff(oldHistory, currentHistory)
	if err != nil {
		log.Print("error parsing history diff")
		return diff, err
	}

	diff.Commands = data

	return diff, nil
}

func FindOldHistoryFile(projectPath string) (string, error) {
	shellDir := filepath.Join(projectPath, ".daemon", "shell")

	entries, err := os.ReadDir(shellDir)
	if err != nil {
		return "", fmt.Errorf("failed to read shell directory: %v", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if strings.HasSuffix(name, "_history") {
			return filepath.Join(shellDir, name), nil
		}
	}

	return "", fmt.Errorf("no history file found in %s", shellDir)
}

func DetectHistoryFile(projectPath string) (string, error) {
	configPath := filepath.Join(projectPath, ".daemon", "config.yaml")

	var shellName string
	var cfg types.ProjectConfig

	// Step 1: Try reading config.yaml
	if data, err := os.ReadFile(configPath); err == nil {
		if err := yaml.Unmarshal(data, &cfg); err == nil {
			if cfg.DefaultShell != "" {
				shellName = cfg.DefaultShell
				log.Println("Using defaultShell from config.yaml:", shellName)
			} else {
				log.Println("config.yaml found but defaultShell missing; will detect and update.")
			}
		} else {
			log.Printf("Failed to parse config.yaml, will recreate: %v", err)
		}
	} else {
		log.Printf("No config.yaml found, will create one: %v", err)
	}

	// Step 2: Detect shell if not found in config
	if shellName == "" {
		shellPath := os.Getenv("SHELL")
		if shellPath == "" {
			out, err := exec.Command("which", "bash").Output()
			if err != nil {
				return "", fmt.Errorf("failed to detect shell: %v", err)
			}
			shellPath = strings.TrimSpace(string(out))
		}
		shellName = filepath.Base(shellPath)
		log.Println("Detected shell:", shellName)

		// ✅ Update config.yaml with detected shell
		cfg.DefaultShell = shellName

		// Ensure .daemon directory exists
		if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
			return "", fmt.Errorf("failed to create .daemon directory: %v", err)
		}

		outData, err := yaml.Marshal(&cfg)
		if err != nil {
			return "", fmt.Errorf("failed to marshal config.yaml: %v", err)
		}

		if err := os.WriteFile(configPath, outData, 0644); err != nil {
			return "", fmt.Errorf("failed to write config.yaml: %v", err)
		}

		log.Printf("Updated %s with defaultShell: %s", configPath, shellName)
	}

	// Step 3: Determine history file path
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home dir: %v", err)
	}

	var histFile string
	switch shellName {
	case "bash":
		histFile = filepath.Join(homeDir, ".bash_history")
	case "zsh":
		histFile = filepath.Join(homeDir, ".zsh_history")
	default:
		return "", fmt.Errorf("unsupported shell: %s", shellName)
	}

	return histFile, nil
}

func UpdateHistory(projectPath string, histFile string) error {
	// Step 3: Prepare destination folder
	destDir := filepath.Join(projectPath, ".daemon", "shell")
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return fmt.Errorf("failed to create destination dir: %v", err)
	}

	// Step 4: Copy history file
	destFile := filepath.Join(destDir, filepath.Base(histFile))
	if err := utils.CopyFileShort(histFile, destFile); err != nil {
		return fmt.Errorf("failed to copy history file: %v", err)
	}

	log.Printf("Copied %s to %s\n", histFile, destFile)

	// cmdArray, err = ParseHistoryFile(destFile)
	// if err != nil {
	// 	log.Printf("Error parsing the history file")
	// 	return cmdArray, err
	// }

	return nil
}

func ParseHistoryDiff(oldPath, newPath string) ([]types.CommandEntry, error) {
	// Helper: read non-empty, trimmed lines from a file
	readLines := func(path string) ([]string, error) {
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, err
		}
		raw := strings.Split(string(data), "\n")
		out := make([]string, 0, len(raw))
		for _, ln := range raw {
			ln = strings.TrimSpace(ln)
			if ln != "" {
				out = append(out, ln)
			}
		}
		return out, nil
	}

	// ✅ If oldPath is empty → do nothing, return empty result
	if oldPath == "" {
		return nil, nil
	}

	// Read new file (required)
	newLines, err := readLines(newPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read new history file: %w", err)
	}

	// Read old file (ignore error if missing)
	oldLines, _ := readLines(oldPath)

	// Build frequency map (multiset) of old lines
	oldCount := make(map[string]int, len(oldLines))
	for _, ln := range oldLines {
		oldCount[ln]++
	}

	// Collect lines present in new but not in old
	diffLines := make([]string, 0, len(newLines))
	for _, ln := range newLines {
		if c := oldCount[ln]; c > 0 {
			oldCount[ln] = c - 1 // consume one instance
			continue
		}
		diffLines = append(diffLines, ln)
	}

	entries := parseLinesToEntries(diffLines)
	return entries, nil
}

func parseLinesToEntries(lines []string) []types.CommandEntry {
	var entries []types.CommandEntry

	for _, line := range lines {
		// Skip malformed or empty lines
		if !strings.HasPrefix(line, ":") {
			continue
		}

		// Example format: ": 1762008614:0;clear"
		parts := strings.SplitN(line, ";", 2)
		if len(parts) != 2 {
			continue
		}

		meta := strings.TrimPrefix(parts[0], ":")
		command := strings.TrimSpace(parts[1])

		metaParts := strings.Split(meta, ":")
		if len(metaParts) < 2 {
			continue
		}

		// Parse timestamp
		timestampUnix, err := strconv.ParseInt(strings.TrimSpace(metaParts[0]), 10, 64)
		if err != nil {
			continue
		}

		// Parse exit code
		exitCode, err := strconv.Atoi(strings.TrimSpace(metaParts[1]))
		if err != nil {
			exitCode = -1
		}

		entry := types.CommandEntry{
			Timestamp: time.Unix(timestampUnix, 0),
			Command:   command,
			ExitCode:  exitCode,
		}

		entries = append(entries, entry)
	}

	return entries
}

// func ParseHistoryDiff(oldPath, newPath string) ([]types.CommandEntry, error) {
// 	var data []types.CommandEntry
// 	if oldPath == "" {
// 		return data, nil
// 	} else {
// 		// Helper function to read lines from a file
// 		readLines := func(path string) ([]string, error) {
// 			data, err := os.ReadFile(path)
// 			if err != nil {
// 				return nil, err
// 			}
// 			lines := strings.Split(string(data), "\n")
// 			var clean []string
// 			for _, line := range lines {
// 				line = strings.TrimSpace(line)
// 				if line != "" {
// 					clean = append(clean, line)
// 				}
// 			}
// 			return clean, nil
// 		}

// 		// Read both files
// 		oldLines, _ := readLines(oldPath) // ignore error if old file missing
// 		newLines, err := readLines(newPath)
// 		if err != nil {
// 			return nil, fmt.Errorf("failed to read new history file: %v", err)
// 		}

// 		// Find the diff (new lines not in old)
// 		startIdx := 0
// 		if len(oldLines) > 0 && len(newLines) > len(oldLines) {
// 			// assume history grows by appending
// 			startIdx = len(newLines) - len(oldLines)
// 			// adjust if partial overlap (simple fallback)
// 			if startIdx < 0 {
// 				startIdx = 0
// 			}
// 		}

// 		diffLines := newLines[startIdx:]
// 		if len(diffLines) == 0 {
// 			return nil, nil // no new commands
// 		}

// 		// Parse diff lines
// 		var entries []types.CommandEntry
// 		for _, line := range diffLines {
// 			if !strings.HasPrefix(line, ":") {
// 				continue // skip malformed lines
// 			}

// 			parts := strings.SplitN(line, ";", 2)
// 			if len(parts) != 2 {
// 				continue
// 			}

// 			meta := strings.TrimPrefix(parts[0], ":")
// 			command := strings.TrimSpace(parts[1])

// 			metaParts := strings.Split(meta, ":")
// 			if len(metaParts) < 2 {
// 				continue
// 			}

// 			timestampUnix, err := strconv.ParseInt(strings.TrimSpace(metaParts[0]), 10, 64)
// 			if err != nil {
// 				continue
// 			}

// 			exitCode, err := strconv.Atoi(strings.TrimSpace(metaParts[1]))
// 			if err != nil {
// 				exitCode = -1
// 			}

// 			entry := types.CommandEntry{
// 				Timestamp: time.Unix(timestampUnix, 0),
// 				Command:   command,
// 				ExitCode:  exitCode,
// 			}
// 			entries = append(entries, entry)
// 		}

// 		return entries, nil
// 	}
// }
