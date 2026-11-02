package config

import (
	"fmt"
	"os"
	"path/filepath"
)

// AppDirName 是应用数据根目录名称
const AppDirName = "AIMux"

// GetAppDataDir 获取操作系统对应的应用数据存储根目录
// Windows: %APPDATA%/AIMux/
// macOS: ~/Library/Application Support/AIMux/
// Linux: ~/.config/AIMux/
func GetAppDataDir() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user config dir: %w", err)
	}
	return filepath.Join(configDir, AppDirName), nil
}

// GetConfigPath 获取 config.json 配置文件的绝对路径
func GetConfigPath() (string, error) {
	appDir, err := GetAppDataDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appDir, "config.json"), nil
}

// GetDBPath 获取 aimux.db SQLite 数据库文件的绝对路径
func GetDBPath() (string, error) {
	appDir, err := GetAppDataDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appDir, "aimux.db"), nil
}

// GetSessionsDir 获取各个 AI 视口独立会话数据目录 (UserDataPath) 根路径
func GetSessionsDir() (string, error) {
	appDir, err := GetAppDataDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appDir, "sessions"), nil
}
