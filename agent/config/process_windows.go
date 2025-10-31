//go:build windows

package config

import (
	"os/exec"
	"syscall"
)

func SetDetachAttr(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{CreationFlags: 0x00000200}
}
