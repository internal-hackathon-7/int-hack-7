package utils

import (
	"os"
	"path/filepath"
)

// safeString turns empty strings into nil pointers
func SafeString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// Utility: Copy entire history file (no line limit)
func CopyFileShort(src, dst string) error {
	// Read the entire file
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}

	// Ensure destination directory exists
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}

	// Write full contents to destination file
	if err := os.WriteFile(dst, data, 0644); err != nil {
		return err
	}

	return nil
}
