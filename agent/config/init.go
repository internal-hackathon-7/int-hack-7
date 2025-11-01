package config

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/internal-hackathon-7/int-hack-7/agent/constants"
	"github.com/internal-hackathon-7/int-hack-7/agent/controller"
	"github.com/internal-hackathon-7/int-hack-7/agent/types"
	"gopkg.in/yaml.v3"
)

// const MasterURL = "https://google.com"
const DisplayName = "daemon"
const DefaultProjectPath = "/Users/aditya/99-trash/dummy"

// startService simulates a background daemon
func StartService(projectPath string, interval int) {
	ticker := time.NewTicker(time.Duration(interval * int(time.Second)))
	defer ticker.Stop()

	for range ticker.C {

		diffBlob, err := controller.ComputeDiff(projectPath)
		if err != nil {
			log.Panic("DIFF error")
		}

		cmdDiffBlob, err := controller.ComputeCmdDiff(projectPath)
		if err != nil {
			log.Panic("CMD DIFF error")
		}

		log.Println("")
		log.Printf("%#v\n", diffBlob.Changes)
		log.Println("")
		log.Printf("%#v\n", cmdDiffBlob)
		log.Println("")

		//idhar then send diff json...to master ;)
		//also send the cmd diff to master
		log.Println("")
		log.Println("one iteration successfull")
		log.Println("")
	}
}

func ConnectRoom(roomID string, emailID string) (interval int, err error) {
	ans := 5
	//api call to connect to room
	//also send email to identify user.
	//asks master for the interval
	//returns interval (seconds)
	return ans, nil
}

// InitCommand handles `daemon init`
func InitCommand() (string, int, string, error) {
	fmt.Println("Welcome to Daemon setup!")

	emailID := prompt("Signup to the Website and then Enter your emailID", "")
	roomID := prompt("Enter your room ID", "")

	interval, err := ConnectRoom(roomID, emailID)
	if err != nil {
		log.Fatalf("Room ID [%v] NOT FOUND", roomID)
	}

	projectPath := prompt("Enter the project path to monitor", DefaultProjectPath)

	config := types.ProjectConfig{
		ProjectPath: projectPath,
		RoomID:      roomID,
		Interval:    interval,
		EmailID:     emailID,
	}

	configDir := filepath.Join(projectPath, ".daemon")
	os.MkdirAll(configDir, 0755)
	configFile := filepath.Join(configDir, "config.yaml")

	data, err := yaml.Marshal(&config)
	if err != nil {
		return "", 0, "", err
	}

	err = os.WriteFile(configFile, data, 0644)
	if err != nil {
		return "", 0, "", err
	}

	fmt.Println("Config saved at", configFile)
	fmt.Println("Proceeding to start service")

	return projectPath, interval, emailID, nil
}

func PingMaster() error {
	failCount := 0
	maxFails := 5
	pingInterval := 2 * time.Second

	for {
		// resp, err := http.Get(constants.MasterURL + "/ping")
		resp, err := http.Get(constants.MasterURL)
		if err != nil {
			failCount++
			fmt.Printf("[%s] Ping FAILED (%d/%d): %v\n",
				time.Now().Format(time.RFC3339), failCount, maxFails, err)
		} else {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				fmt.Printf("[%s] Server REACHABLE \n",
					time.Now().Format(time.RFC3339))
				fmt.Println("")
				return nil
			} else {
				failCount++
				fmt.Printf("[%s] Server responded with status (%d/%d): %s\n",
					time.Now().Format(time.RFC3339), failCount, maxFails, resp.Status)
			}
		}

		if failCount >= maxFails {
			fmt.Println("Max failures reached. Stopping pinger.")
			return fmt.Errorf("ping failed after %d attempts", failCount)
		}

		time.Sleep(pingInterval)
	}
}

// prompt helps in reading user input
func prompt(question, defaultVal string) string {
	reader := bufio.NewReader(os.Stdin)
	if defaultVal != "" {
		fmt.Printf("%s [%s]: ", question, defaultVal)
	} else {
		fmt.Printf("%s: ", question)
	}
	input, _ := reader.ReadString('\n')
	input = strings.TrimSpace(input)
	if input == "" {
		return defaultVal
	}
	return input
}

func EnsureDaemonInGitignore(projectPath string) error {
	gitignorePath := fmt.Sprintf("%s/.gitignore", projectPath)
	daemonIgnore := ".daemon/"

	// Read existing .gitignore if it exists
	data, err := os.ReadFile(gitignorePath)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to read .gitignore: %w", err)
	}

	// Check if ".daemon" is already ignored
	if strings.Contains(string(data), daemonIgnore) {
		log.Println(".daemon already present in .gitignore")
		return nil
	}

	// Append or create new .gitignore
	f, err := os.OpenFile(gitignorePath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("failed to open .gitignore: %w", err)
	}
	defer f.Close()

	if _, err := f.WriteString("\n" + daemonIgnore + "\n"); err != nil {
		return fmt.Errorf("failed to write to .gitignore: %w", err)
	}

	log.Printf("Added '%s' to .gitignore\n", daemonIgnore)
	return nil
}

func EnsureGitRepo(projectPath string) error {
	gitDir := filepath.Join(projectPath, ".git")

	// Check if .git already exists
	if _, err := os.Stat(gitDir); err == nil {
		fmt.Println("Git repository already initialized.")
		return nil
	} else if !os.IsNotExist(err) {
		return fmt.Errorf("failed to check .git directory: %w", err)
	}

	// Run `git init`
	cmd := exec.Command("git", "init")
	cmd.Dir = projectPath
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	fmt.Println("Initializing new git repository...")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to initialize git repository: %w", err)
	}

	fmt.Println("Git repository initialized successfully.")
	return nil
}
