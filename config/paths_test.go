package config_test

import (
	"path/filepath"
	"strings"
	"testing"

	"aimux/config"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPaths_GetAppDataDir(t *testing.T) {
	dir, err := config.GetAppDataDir()
	require.NoError(t, err)
	assert.NotEmpty(t, dir)
	assert.True(t, strings.HasSuffix(dir, "AIMux") || strings.HasSuffix(dir, "aimux"))
}

func TestPaths_GetConfigPath(t *testing.T) {
	path, err := config.GetConfigPath()
	require.NoError(t, err)
	assert.NotEmpty(t, path)
	assert.Equal(t, "config.json", filepath.Base(path))
}

func TestPaths_GetDBPath(t *testing.T) {
	path, err := config.GetDBPath()
	require.NoError(t, err)
	assert.NotEmpty(t, path)
	assert.Equal(t, "aimux.db", filepath.Base(path))
}

func TestPaths_GetSessionsDir(t *testing.T) {
	path, err := config.GetSessionsDir()
	require.NoError(t, err)
	assert.NotEmpty(t, path)
	assert.Equal(t, "sessions", filepath.Base(path))
}
