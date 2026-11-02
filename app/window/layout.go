package window

import (
	"fmt"
	"math"

	"aimux/config"
)

// NormalizeLayoutMode 校验并规范化布局模式名称
func NormalizeLayoutMode(mode string) (string, error) {
	switch mode {
	case config.LayoutSingle:
		return config.LayoutSingle, nil
	case config.LayoutDual, config.LayoutDouble:
		return config.LayoutDual, nil
	case config.LayoutGrid, config.LayoutGrid4:
		return config.LayoutGrid, nil
	case config.LayoutUltrawide:
		return config.LayoutUltrawide, nil
	case config.LayoutMainSub:
		return config.LayoutMainSub, nil
	default:
		return "", fmt.Errorf("unsupported layout mode: %s", mode)
	}
}

// ComputeViewportBounds 根据容器大小和布局模式计算各个视口的物理 Bounds
func ComputeViewportBounds(mode string, container Container, count ...int) []Rect {
	width := container.Width
	height := container.Height

	// 容器尺寸异常时的防御性保护
	if width <= 0 || height <= 0 {
		return []Rect{{X: 0, Y: 0, Width: 0, Height: 0}}
	}

	normMode, err := NormalizeLayoutMode(mode)
	if err != nil {
		normMode = config.LayoutSingle
	}

	switch normMode {
	case config.LayoutSingle:
		return []Rect{{X: 0, Y: 0, Width: width, Height: height}}

	case config.LayoutDual:
		w1 := width / 2
		w2 := width - w1
		return []Rect{
			{X: 0, Y: 0, Width: w1, Height: height},
			{X: w1, Y: 0, Width: w2, Height: height},
		}

	case config.LayoutGrid:
		w1 := width / 2
		w2 := width - w1
		h1 := height / 2
		h2 := height - h1
		return []Rect{
			{X: 0, Y: 0, Width: w1, Height: h1},
			{X: w1, Y: 0, Width: w2, Height: h1},
			{X: 0, Y: h1, Width: w1, Height: h2},
			{X: w1, Y: h1, Width: w2, Height: h2},
		}

	case config.LayoutUltrawide:
		n := 4
		if len(count) > 0 && count[0] > 0 {
			n = count[0]
		}
		bounds := make([]Rect, 0, n)
		baseWidth := width / n
		currentX := 0

		for i := 0; i < n; i++ {
			colWidth := baseWidth
			if i == n-1 {
				colWidth = width - currentX
			}
			bounds = append(bounds, Rect{
				X:      currentX,
				Y:      0,
				Width:  colWidth,
				Height: height,
			})
			currentX += colWidth
		}
		return bounds

	case config.LayoutMainSub:
		totalCount := 2
		if len(count) > 0 && count[0] > 1 {
			totalCount = count[0]
		}
		mainWidth := int(math.Round(float64(width) * config.DefaultMainSubSplitRatio))
		subWidth := width - mainWidth
		subCount := totalCount - 1

		bounds := make([]Rect, 0, totalCount)
		bounds = append(bounds, Rect{
			X:      0,
			Y:      0,
			Width:  mainWidth,
			Height: height,
		})

		baseSubHeight := height / subCount
		currentY := 0

		for i := 0; i < subCount; i++ {
			subH := baseSubHeight
			if i == subCount-1 {
				subH = height - currentY
			}
			bounds = append(bounds, Rect{
				X:      mainWidth,
				Y:      currentY,
				Width:  subWidth,
				Height: subH,
			})
			currentY += subH
		}
		return bounds

	default:
		return []Rect{{X: 0, Y: 0, Width: width, Height: height}}
	}
}
