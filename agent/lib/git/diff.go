package lib

import (
	"fmt"
	"time"

	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/go-git/go-git/v5/utils/merkletrie"
	"github.com/internal-hackathon-7/int-hack-7/agent/types"
	"github.com/internal-hackathon-7/int-hack-7/agent/utils"
)

func DiffWithHash(projectPath, oldHash, newHash string) (types.DiffBlob, error) {
	var diffBlob types.DiffBlob

	// Open the repository
	repo, err := FindRepo(projectPath)
	if err != nil {
		return diffBlob, fmt.Errorf("error opening repo: %w", err)
	}

	// Load trees directly (since the hashes come from `git write-tree`)
	oldTree, err := repo.TreeObject(plumbing.NewHash(oldHash))
	if err != nil {
		return diffBlob, fmt.Errorf("old tree not found: %w", err)
	}

	newTree, err := repo.TreeObject(plumbing.NewHash(newHash))
	if err != nil {
		return diffBlob, fmt.Errorf("new tree not found: %w", err)
	}

	// Compute changes between trees
	changes, err := oldTree.Diff(newTree)
	if err != nil {
		return diffBlob, fmt.Errorf("error generating diff: %w", err)
	}

	// Get the full patch diff (like `git diff-tree -p`)
	// patch, err := changes.Patch()
	// if err != nil {
	// 	return diffBlob, fmt.Errorf("error creating patch: %w", err)
	// }

	// log.Println("\n--- PATCH DIFF ---")
	// log.Println(patch.String())

	diffBlob, err = BuildDiffJSON(projectPath, oldHash, newHash, changes)
	if err != nil {
		return diffBlob, fmt.Errorf("error making change json : %w", err)
	}

	return diffBlob, nil
}

func BuildDiffJSON(projectName, oldHash, newHash string, changes object.Changes) (types.DiffBlob, error) {
	report := &types.DiffBlob{
		ProjectName: projectName,
		OldHash:     oldHash,
		NewHash:     newHash,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
	}

	var totalInsertions, totalDeletions, totalRenames, totalCopies int

	for _, change := range changes {
		action, _ := change.Action()

		fileChange := types.FileChange{
			Action: string(action),
		}

		if change.From.Name != "" {
			fileChange.OldPath = utils.SafeString(change.From.Name)
			fileChange.OldMode = change.From.TreeEntry.Mode.String()
			fileChange.HashBefore = utils.SafeString(change.From.TreeEntry.Hash.String())
		}

		if change.To.Name != "" {
			fileChange.NewPath = utils.SafeString(change.To.Name)
			fileChange.NewMode = change.To.TreeEntry.Mode.String()
			fileChange.HashAfter = utils.SafeString(change.To.TreeEntry.Hash.String())
		}

		// Extract patch (diff content)
		patch, err := change.Patch()
		if err == nil && patch != nil {
			stats := patch.Stats()
			if len(stats) > 0 {
				fileChange.LinesAdded = stats[0].Addition
				fileChange.LinesDeleted = stats[0].Deletion
				totalInsertions += stats[0].Addition
				totalDeletions += stats[0].Deletion
			}

			diffText := patch.String()
			if diffText != "" {
				fileChange.Patch = &types.PatchInfo{DiffText: diffText}
			}
		}

		// Count rename/copy summary stats
		switch action {
		case merkletrie.Insert:
			// new file added
		case merkletrie.Delete:
			// file deleted
		case merkletrie.Modify:
			// file modified
		}

		report.Changes = append(report.Changes, fileChange)
	}

	report.Summary = types.SummaryInfo{
		FilesChanged: len(report.Changes),
		Insertions:   totalInsertions,
		Deletions:    totalDeletions,
		Renames:      totalRenames,
		Copies:       totalCopies,
	}

	return *report, nil
}
