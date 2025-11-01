package controller

import (
	"log"

	lib "github.com/internal-hackathon-7/int-hack-7/agent/lib/cmd"
	"github.com/internal-hackathon-7/int-hack-7/agent/types"
)

func ComputeCmdDiff(projectPath string) (types.CmdDiffBlob, error) {
	var cmdDiff types.CmdDiffBlob

	currentHistFile, err := lib.DetectHistoryFile(projectPath)
	if err != nil {
		log.Print("error in finding history file")
		return cmdDiff, err
	}

	cmdDiff, err = lib.DiffCmdHistory(projectPath, currentHistFile)
	if err != nil {
		log.Println("error diffing : ", err)
		return cmdDiff, nil
	}

	err = lib.UpdateHistory(projectPath, currentHistFile)
	if err != nil {
		log.Print("error finding latest command history")
		return cmdDiff, nil
	}

	return cmdDiff, nil
}
