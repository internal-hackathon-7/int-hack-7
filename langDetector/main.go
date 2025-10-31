package main

import (
	"fmt"
	"log"

	"langDetector/pkg/extToLang"
)

func main() {
	root := "."

	exts, err := extToLang.CollectExtensions(root)
	if err != nil {
		log.Fatal(err)
	}

	langs := extToLang.DetectLanguages(exts)
	if len(langs) == 0 {
		fmt.Println("No known languages detected.")
		return
	}

	fmt.Println("Detected languages:", langs)

	if err := extToLang.WriteGitignore(langs); err != nil {
		log.Fatal(err)
	}

	fmt.Println("✅ .gitignore generated successfully!")
}
