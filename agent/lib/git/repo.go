package lib

import (
	"fmt"

	"github.com/go-git/go-git/v5"
)

func FindRepo(projectPath string) (*git.Repository, error) {
	var repo *git.Repository
	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return repo, fmt.Errorf("error opening repo: %w", err)
	}

	return repo, nil
}
