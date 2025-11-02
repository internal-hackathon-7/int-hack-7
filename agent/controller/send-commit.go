package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/internal-hackathon-7/int-hack-7/agent/types"
)

func SendCommit(url string, payload types.CommitPayload) error {
	// Marshal the payload into JSON
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %v", err)
	}

	// Make a POST request
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("failed to send POST request: %v", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %v", err)
	}

	// Parse the response
	var res struct {
		Success bool   `json:"success"`
		Message string `json:"message,omitempty"`
	}

	if err := json.Unmarshal(body, &res); err != nil {
		return fmt.Errorf("failed to parse response JSON: %v\nResponse: %s", err, string(body))
	}

	// Check the success flag
	if !res.Success {
		fmt.Errorf("commit failed: %s", res.Message)
	}

	log.Println(" ===Commit successfully sent!=== ")
	return nil
}
