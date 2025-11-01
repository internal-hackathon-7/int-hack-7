package controller

import (
	"log"

	lib "github.com/internal-hackathon-7/int-hack-7/agent/lib/git"
	"github.com/internal-hackathon-7/int-hack-7/agent/types"
)

func ComputeDiff(projectPath string) (types.DiffBlob, error) {
	var diffBlob types.DiffBlob

	oldHash, err := GetLastHash(projectPath)
	if err != nil {
		log.Panic("error finding last hash")
		return diffBlob, nil
	}
	newHash, err := GetNewHash(projectPath)
	if err != nil {
		log.Panic("error getting new hash")
		return diffBlob, nil
	}

	diffBlob, err = lib.DiffWithHash(projectPath, oldHash, newHash)
	if err != nil {
		log.Println("error diffing : ", err)
		return diffBlob, nil
	}

	return diffBlob, nil
}
