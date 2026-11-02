package window

// Rect 定义视口在屏幕或父容器内的物理像素坐标与尺寸
type Rect struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

// Container 定义布局计算时可用容器区域宽高
type Container struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

// ViewportState 表示视口在多窗口状态机中的生命周期状态
type ViewportState string

const (
	StateHidden    ViewportState = "hidden"
	StateVisible   ViewportState = "visible"
	StateSuspended ViewportState = "suspended"
	StateDetached  ViewportState = "detached"
)

// WindowHandle 抽象原生窗口操作接口，用于解耦 Wails 运行时与方便单元测试
type WindowHandle interface {
	ID() uint
	Name() string
	Show()
	Hide()
	Close()
	Focus()
	Bounds() Rect
	SetBounds(bounds Rect)
	IsVisible() bool
	SetZoom(zoom float64)
}
