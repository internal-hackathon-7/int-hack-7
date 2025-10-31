package main

import (
	"fmt"
	"log"
	"os"

	"github.com/internal-hackathon-7/int-hack-7/agent/config"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Printf("Usage: %s <command>", config.DisplayName)
		fmt.Println("Commands: init")
		return
	}

	switch os.Args[1] {
	case "init":
		if err := config.PingMaster(); err != nil {
			log.Fatal("Connection NOT established! Service down")
		}
		if err := config.InitCommand(); err != nil {
			fmt.Println("Error:", err)
		}
		config.StartService()

	default:
		fmt.Println("Unknown command:", os.Args[1])
	}
}
