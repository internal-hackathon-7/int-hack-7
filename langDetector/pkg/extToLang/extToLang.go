package extToLang

import (
	"os"
    "fmt"
    "github.com/go-enry/go-enry/v2"
	"io"
	"io/fs"
	"path/filepath"
	"strings"
	"net/http"
)

func CollectExtensions(root string) (map[string]struct{}, error) {
	exts := make(map[string]struct{})

	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() {
			ext := filepath.Ext(path)
			if ext != "" {
				exts[strings.ToLower(ext)] = struct{}{}
			}
		}
		return nil
	})

	return exts, err
}

func ExtToLang(ext string) (string) {
    lang, _:= enry.GetLanguageByExtension(ext)
    return lang
}

func FetchGitignoreTemplate(lang string) (string, error) {
	url := fmt.Sprintf("https://raw.githubusercontent.com/github/gitignore/main/%s.gitignore", lang)
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("template not found for %s", lang)
	}

	body, err := io.ReadAll(resp.Body)
	return string(body), err
}

func DetectLanguages(exts map[string]struct{}) []string {
	langs := make(map[string]struct{})
	for ext := range exts {
		lang := ExtToLang(ext)
		if lang == "" {
			continue
		}
		langs[lang] = struct{}{}
	}

	var result []string
	for lang := range langs {
		result = append(result, lang)
	}
	return result
}


func WriteGitignore(langs []string) error {
	var combined []string

	for _, lang := range langs {
		content, err := FetchGitignoreTemplate(lang)
		if err != nil {
			fmt.Printf("⚠️  Could not fetch %s.gitignore: %v\n", lang, err)
			continue
		}
		header := fmt.Sprintf("# ===== %s.gitignore =====\n", lang)
		combined = append(combined, header+content+"\n")
	}

	return os.WriteFile(".gitignore", []byte(strings.Join(combined, "\n")), 0644)
}