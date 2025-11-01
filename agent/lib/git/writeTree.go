package lib

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
)

func CommitSnapshot(projectPath string) (plumbing.Hash, error) {
	repo, err := FindRepo(projectPath)
	if err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error opening repo: %w", err)
	}

	wt, err := repo.Worktree()
	if err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error getting worktree: %w", err)
	}

	// Stage everything like `git add .`
	if err := wt.AddWithOptions(&git.AddOptions{All: true}); err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error adding files: %w", err)
	}

	// Create a tree from the index
	treeHash, err := WriteTree(projectPath, repo)
	if err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error writing tree: %w", err)
	}

	// Optional: get parent commit (HEAD)
	var parents []plumbing.Hash
	if head, err := repo.Head(); err == nil {
		if parentCommit, err := repo.CommitObject(head.Hash()); err == nil {
			parents = append(parents, parentCommit.Hash)
		}
	}

	// Create a commit object (but not update HEAD)
	commit := &object.Commit{
		Author: object.Signature{
			Name:  "Daemon Auto Commit",
			Email: "daemon@local",
			When:  time.Now(),
		},
		Committer: object.Signature{
			Name:  "Daemon Auto Commit",
			Email: "daemon@local",
			When:  time.Now(),
		},
		Message:      fmt.Sprintf("Snapshot %s", time.Now().Format("2006-01-02 15:04")),
		TreeHash:     treeHash,
		ParentHashes: parents,
	}

	obj := repo.Storer.NewEncodedObject()
	if err := commit.Encode(obj); err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error encoding commit: %w", err)
	}
	// commitHash, err := repo.Storer.SetEncodedObject(obj)
	// if err != nil {
	// 	return plumbing.ZeroHash, fmt.Errorf("error storing commit: %w", err)
	// }

	//IMPORTANT : for now we make the commits but are not using it, so only returning the tree hash... some of above lines are future oriented.

	return treeHash, nil
}

func WriteTree(projectPath string, repo *git.Repository) (plumbing.Hash, error) {
	// 1️⃣ Get the index (the staging area)
	idx, err := repo.Storer.Index()
	if err != nil {
		return plumbing.ZeroHash, fmt.Errorf("cannot read index: %w", err)
	}

	// 2️⃣ Convert the index to a Tree object
	tree := &object.Tree{}
	for _, entry := range idx.Entries {
		tree.Entries = append(tree.Entries, object.TreeEntry{
			Name: entry.Name,
			Mode: entry.Mode,
			Hash: entry.Hash,
		})
	}

	// 3️⃣ Encode and store the Tree object
	obj := repo.Storer.NewEncodedObject()
	if err := tree.Encode(obj); err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error encoding tree: %w", err)
	}

	// 4️⃣ Write the object to the database
	treeHash, err := repo.Storer.SetEncodedObject(obj)
	if err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error saving tree: %w", err)
	}

	// 5️⃣ Store the generated tree hash in .daemon/state.txt
	stateDir := filepath.Join(projectPath, ".daemon")
	stateFile := filepath.Join(stateDir, "state.txt")

	// Ensure the directory exists
	if err := os.MkdirAll(stateDir, 0755); err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error creating state dir: %w", err)
	}

	// Open (or create) the file in append mode
	f, err := os.OpenFile(stateFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error opening state file: %w", err)
	}
	defer f.Close()

	// Write a line with timestamp and hash
	line := fmt.Sprintf("%s %s\n", time.Now().Format(time.RFC3339), treeHash.String())
	if _, err := f.WriteString(line); err != nil {
		return plumbing.ZeroHash, fmt.Errorf("error writing to state file: %w", err)
	}

	log.Printf("new hash added : %s", treeHash.String())

	return treeHash, nil
}
