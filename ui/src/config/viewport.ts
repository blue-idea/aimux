/**
 * 视口与布局核心常量配置
 * 对应 REQ-002 与后端 config/defaults.go
 */

// 默认桌面端防折叠断点 (px)，视口宽低于该值时触发自适应缩放
export const DEFAULT_ZOOM_BREAKPOINT = 850;

// 最小缩放保底系数 (75%)，防止极端窄屏时字体过小或过度形变
export const MIN_ZOOM = 0.75;

// 最大缩放系数，默认不进行内容放大
export const MAX_ZOOM = 1.0;

// 支持的 5 种核心布局模式
export type LayoutMode = 'single' | 'dual' | 'grid' | 'ultrawide' | 'main-sub';

// 主辅布局中主视口的默认宽度占比
export const DEFAULT_MAIN_SUB_SPLIT_RATIO = 0.65;
