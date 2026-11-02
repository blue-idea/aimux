.PHONY: dev build clean

# 跨平台/Linux/macOS 默认执行入口
dev:
	WAILS_EXP_USE_WAKE=1 wails3 dev

build:
	WAILS_EXP_USE_WAKE=1 wails3 build

clean:
	rm -rf .wails bin ui/dist
