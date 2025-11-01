package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"

	"github.com/internal-hackathon-7/int-hack-7/agent/config"
	"github.com/internal-hackathon-7/int-hack-7/agent/constants"
	"github.com/joho/godotenv"
)

// DELETE IN PROD
const CREATE_NEW_PROCESS_GROUP = 0x00000200

func main() {
	if len(os.Args) < 2 {
		fmt.Printf("Usage: %s <command>", config.DisplayName)
		fmt.Println("Commands: init")
		return
	}

	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	constants.MasterURL = os.Getenv("MasterURL")

	switch os.Args[1] {
	case "init":
		if err := config.PingMaster(); err != nil {
			log.Fatal("Connection NOT established! Service down")
		}
		projectPath, interval, emailID, err := config.InitCommand()
		if err != nil {
			fmt.Println("Error:", err)
		}

		exePath, err := os.Executable()
		if err != nil {
			log.Fatalf("Failed to get executable path: %v", err)
		}

		// example: replace below with your actual command & flags
		cmd := exec.Command(exePath,
			"run",
			"-path", projectPath,
			"-interval", fmt.Sprintf("%d", interval),
			"-email", emailID,
		)

		// detach from terminal (run in background)
		cmd.Stdout = nil
		cmd.Stderr = nil
		cmd.Stdin = nil

		config.SetDetachAttr(cmd)

		if err := cmd.Start(); err != nil {
			log.Fatalf("Failed to start background command: %v", err)
		}

		fmt.Printf("Started background process with PID %d\n", cmd.Process.Pid)

	case "run":
		initCmd := flag.NewFlagSet("run", flag.ExitOnError)
		projectPath := initCmd.String("path", ".", "Path to the project directory to monitor")
		interval := initCmd.Int("interval", 10, "Polling interval in seconds (integer only)")
		email := initCmd.String("email", "", "Email address for identification or notifications")

		if err := initCmd.Parse(os.Args[2:]); err != nil {
			log.Fatal(err)
		}

		daemonDir := fmt.Sprintf("%s/.daemon", *projectPath)
		if err := os.MkdirAll(daemonDir, 0755); err != nil {
			log.Fatalf("Failed to create daemon directory: %v", err)
		}

		// --- SETUP LOG FILE ---
		logFilePath := fmt.Sprintf("%s/agent.log", daemonDir)
		logFile, err := os.OpenFile(logFilePath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
		if err != nil {
			log.Fatalf("Failed to open log file: %v", err)
		}
		defer logFile.Close()

		log.SetOutput(logFile)
		log.SetFlags(log.LstdFlags | log.Lshortfile)

		log.Println("Agent starting up...")
		log.Println("email :", email)
		log.Printf("Monitoring path: %s\n", *projectPath)
		log.Printf("Interval: %d seconds\n", *interval)

		// --- append to PID FILE ---
		pidFilePath := fmt.Sprintf("%s/agent.pid", daemonDir)
		pid := os.Getpid()

		// Open (or create) the file, wiping any previous content
		f, err := os.OpenFile(pidFilePath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
		if err != nil {
			log.Fatalf("Failed to open PID file: %v", err)
		}
		defer f.Close()

		// Write the PID (kill friendly)
		if _, err := f.WriteString(fmt.Sprintf("%d\n", pid)); err != nil {
			log.Fatalf("Failed to write PID to file: %v", err)
		}

		log.Printf("PID %d written fresh to %s\n", pid, pidFilePath)

		if err := config.EnsureGitRepo(*projectPath); err != nil {
			log.Printf("Warning: could not get GIT : %v\n", err)
		}

		if err := config.EnsureDaemonInGitignore(*projectPath); err != nil {
			log.Printf("Warning: could not update .gitignore: %v\n", err)
		}

		// --- START SERVICE ---
		config.StartService(*projectPath, *interval)

		// --- CLEANUP WHEN EXITING ---
		os.Remove(pidFilePath)
		log.Println("Agent shutting down.")

	default:
		fmt.Println("Unknown command:", os.Args[1])
	}
}
