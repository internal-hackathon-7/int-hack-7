package types

type ProjectConfig struct {
	MasterURL string `yaml:"master_url"`
	RoomID    string `yaml:"room_id"`
	Interval  int    `yaml:"interval_minutes"`
	AuthToken string `yaml:"auth_token"`
	// WatchDirs       []string `yaml:"watch_dirs"`
	ProjectPath  string   `yaml:"project_path"`
	DaemonIgnore []string `yaml:"daemon_ignore"`
}
