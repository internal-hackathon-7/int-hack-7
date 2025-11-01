package utils

// safeString turns empty strings into nil pointers
func SafeString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
