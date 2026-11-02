#!/usr/bin/env bash
set -e

# 设置 Wails v3 Wake 构建引擎启用标志
export WAILS_EXP_USE_WAKE=1

# 执行 wails3 dev 并透传所有参数
exec wails3 dev "$@"
