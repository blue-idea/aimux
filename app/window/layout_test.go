package window

import (
	"testing"

	"aimux/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNormalizeLayoutMode(t *testing.T) {
	t.Run("支持合法标准布局模式", func(t *testing.T) {
		mode, err := NormalizeLayoutMode(config.LayoutSingle)
		require.NoError(t, err)
		assert.Equal(t, config.LayoutSingle, mode)

		mode, err = NormalizeLayoutMode(config.LayoutDual)
		require.NoError(t, err)
		assert.Equal(t, config.LayoutDual, mode)

		mode, err = NormalizeLayoutMode(config.LayoutGrid)
		require.NoError(t, err)
		assert.Equal(t, config.LayoutGrid, mode)

		mode, err = NormalizeLayoutMode(config.LayoutUltrawide)
		require.NoError(t, err)
		assert.Equal(t, config.LayoutUltrawide, mode)

		mode, err = NormalizeLayoutMode(config.LayoutMainSub)
		require.NoError(t, err)
		assert.Equal(t, config.LayoutMainSub, mode)
	})

	t.Run("支持兼容别名模式并自动规整", func(t *testing.T) {
		mode, err := NormalizeLayoutMode("double")
		require.NoError(t, err)
		assert.Equal(t, config.LayoutDual, mode)

		mode, err = NormalizeLayoutMode("grid4")
		require.NoError(t, err)
		assert.Equal(t, config.LayoutGrid, mode)
	})

	t.Run("不支持非法模式并报错", func(t *testing.T) {
		_, err := NormalizeLayoutMode("invalid-mode")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "unsupported layout mode")
	})
}

func TestComputeViewportBounds(t *testing.T) {
	container := Container{Width: 1600, Height: 1000}

	t.Run("单视口布局 single 充满整个容器", func(t *testing.T) {
		bounds := ComputeViewportBounds(config.LayoutSingle, container)
		require.Len(t, bounds, 1)
		assert.Equal(t, Rect{X: 0, Y: 0, Width: 1600, Height: 1000}, bounds[0])
	})

	t.Run("双视口分栏 dual 左右各占一半", func(t *testing.T) {
		bounds := ComputeViewportBounds(config.LayoutDual, container)
		require.Len(t, bounds, 2)
		assert.Equal(t, Rect{X: 0, Y: 0, Width: 800, Height: 1000}, bounds[0])
		assert.Equal(t, Rect{X: 800, Y: 0, Width: 800, Height: 1000}, bounds[1])
	})

	t.Run("四宫格布局 grid 2x2 四等分且坐标正确", func(t *testing.T) {
		bounds := ComputeViewportBounds(config.LayoutGrid, container)
		require.Len(t, bounds, 4)
		assert.Equal(t, Rect{X: 0, Y: 0, Width: 800, Height: 500}, bounds[0])
		assert.Equal(t, Rect{X: 800, Y: 0, Width: 800, Height: 500}, bounds[1])
		assert.Equal(t, Rect{X: 0, Y: 500, Width: 800, Height: 500}, bounds[2])
		assert.Equal(t, Rect{X: 800, Y: 500, Width: 800, Height: 500}, bounds[3])
	})

	t.Run("带鱼屏布局 ultrawide 按列数水平无缝等分", func(t *testing.T) {
		bounds := ComputeViewportBounds(config.LayoutUltrawide, container, 4)
		require.Len(t, bounds, 4)
		for i, b := range bounds {
			assert.Equal(t, i*400, b.X)
			assert.Equal(t, 0, b.Y)
			assert.Equal(t, 400, b.Width)
			assert.Equal(t, 1000, b.Height)
		}
	})

	t.Run("主辅布局 main-sub 主视口占 65% 辅视口垂直平分", func(t *testing.T) {
		bounds := ComputeViewportBounds(config.LayoutMainSub, container, 3)
		require.Len(t, bounds, 3)

		// 1600 * 0.65 = 1040
		assert.Equal(t, Rect{X: 0, Y: 0, Width: 1040, Height: 1000}, bounds[0])
		// 辅视口平分 1600 - 1040 = 560，高度平分 1000 / 2 = 500
		assert.Equal(t, Rect{X: 1040, Y: 0, Width: 560, Height: 500}, bounds[1])
		assert.Equal(t, Rect{X: 1040, Y: 500, Width: 560, Height: 500}, bounds[2])
	})

	t.Run("奇数像素尺寸时自动像素对齐消除接缝", func(t *testing.T) {
		oddContainer := Container{Width: 1601, Height: 901}

		dualBounds := ComputeViewportBounds(config.LayoutDual, oddContainer)
		require.Len(t, dualBounds, 2)
		assert.Equal(t, 1601, dualBounds[0].Width+dualBounds[1].Width)

		gridBounds := ComputeViewportBounds(config.LayoutGrid, oddContainer)
		require.Len(t, gridBounds, 4)
		assert.Equal(t, 1601, gridBounds[0].Width+gridBounds[1].Width)
		assert.Equal(t, 901, gridBounds[0].Height+gridBounds[2].Height)
	})

	t.Run("极端零或负数尺寸安全防御返回非崩溃默认矩形", func(t *testing.T) {
		zeroBounds := ComputeViewportBounds(config.LayoutSingle, Container{Width: 0, Height: 0})
		require.Len(t, zeroBounds, 1)
		assert.Equal(t, Rect{X: 0, Y: 0, Width: 0, Height: 0}, zeroBounds[0])

		negBounds := ComputeViewportBounds(config.LayoutGrid, Container{Width: -100, Height: -50})
		require.Len(t, negBounds, 1)
		assert.Equal(t, Rect{X: 0, Y: 0, Width: 0, Height: 0}, negBounds[0])
	})

	t.Run("非法模式回退为 single 默认布局", func(t *testing.T) {
		fallbackBounds := ComputeViewportBounds("unknown-mode", container)
		require.Len(t, fallbackBounds, 1)
		assert.Equal(t, Rect{X: 0, Y: 0, Width: 1600, Height: 1000}, fallbackBounds[0])
	})
}
