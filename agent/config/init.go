package config

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/internal-hackathon-7/int-hack-7/agent/types"
	"gopkg.in/yaml.v3"
)

const MasterURL = "https://google.com"
const DisplayName = "daemon"
const DefaultProjectPath = "/Users/aditya/99-trash/dummy"

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

func ConnectRoom(roomID string) (interval int, err error) {
	//api call to connect to room
	//asks master for the interval
	//returns interval (seconds)
	return 5, nil
}

// InitCommand handles `daemon init`
func InitCommand() (string, int, error) {
	fmt.Println("Welcome to Daemon setup!")

	roomID := prompt("Enter your room ID", "")

	interval, err := ConnectRoom(roomID)
	if err != nil {
		log.Fatalf("Room ID [%v] NOT FOUND", roomID)
	}

	projectPath := prompt("Enter the project path to monitor", DefaultProjectPath)

	config := types.ProjectConfig{
		ProjectPath: projectPath,
		RoomID:      roomID,
		Interval:    interval,
	}

	configDir := filepath.Join(projectPath, ".daemon")
	os.MkdirAll(configDir, 0755)
	configFile := filepath.Join(configDir, "config.yaml")

	data, err := yaml.Marshal(&config)
	if err != nil {
		return "", 0, err
	}

	err = os.WriteFile(configFile, data, 0644)
	if err != nil {
		return "", 0, err
	}

	fmt.Println("Config saved at", configFile)
	fmt.Println("Proceeding to start service")

	return projectPath, interval, nil
}

// startService simulates a background daemon
func StartService(projectPath string, interval int) {
	ticker := time.NewTicker(time.Duration(interval * int(time.Second)))
	defer ticker.Stop()

	for range ticker.C {
		log.Println("per interval tasks doing")
		log.Println("project path = ", projectPath)
		log.Println("interval = ", interval)
		log.Println("per interval tasks done")
	}
}

func PingMaster() error {
	failCount := 0
	maxFails := 5
	pingInterval := 2 * time.Second

	for {
		resp, err := http.Get(MasterURL)
		if err != nil {
			failCount++
			fmt.Printf("[%s] Ping FAILED (%d/%d): %v\n",
				time.Now().Format(time.RFC3339), failCount, maxFails, err)
		} else {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				fmt.Printf("[%s] Server REACHABLE \n",
					time.Now().Format(time.RFC3339))
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
