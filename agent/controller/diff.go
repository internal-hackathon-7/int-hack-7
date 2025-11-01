package controller

import (
	"log"

	"github.com/internal-hackathon-7/int-hack-7/agent/lib"
)

func ComputeDiff() error {
	oldHash := "skdf;alf"
	newHash := "skdklasjfd"
	err := lib.DiffWithHash(oldHash, newHash)
	if err != nil {
		log.Panic("error diffing : ", err)
	}
	return nil
}
