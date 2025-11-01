package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// PostAndCheck sends a POST request with any struct payload,
// and ensures the response JSON has { "success": true }.
func PostAndCheck[T any](url string, payload T) error {
	// Marshal payload to JSON
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %v", err)
	}

	// Send POST request
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to send POST request: %v", err)
	}
	defer resp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %v", err)
	}

	// Parse JSON response
	var respMap map[string]interface{}
	if err := json.Unmarshal(respBody, &respMap); err != nil {
		return fmt.Errorf("failed to parse JSON: %v", err)
	}

	// Check for "success" field
	success, ok := respMap["success"].(bool)
	if !ok {
		return fmt.Errorf(`response missing or invalid "success" field: %s`, string(respBody))
	}
	if !success {
		return fmt.Errorf("server returned success=false: %s", string(respBody))
	}

	return nil
}
