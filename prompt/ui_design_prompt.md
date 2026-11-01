# 现代多 AI 桌面工作台（aimux）界面设计完整 Prompt 指南

> 本文档由项目需求与设计规范 (`requirements_and_design_spec.md`)、实现架构 (`implementation.md`) 及 5 阶段计划深度提炼而成，是一份**自包含、工业级、可直接用于各类 AI 生成工具（v0 / Figma AI / Claude Artifacts / Midjourney / Dribbble）或交付前端/UI 设计师的完整设计 Prompt 规范**。

---

## 目录

1. [Prompt 概述与使用指南](#1-prompt-概述与使用指南)
2. [全景大师级设计 Prompt（中文完整版）](#2-全景大师级设计-prompt中文完整版)
3. [Master UI Generation Prompt（English Version）](#3-master-ui-generation-promptenglish-version)
4. [三大独立窗口专项设计 Prompt](#4-三大独立窗口专项设计-prompt)
   - 4.1 主工作台窗口（Shell Main Workspace）
   - 4.2 全局极速 AI 悬浮窗（Spotlight Quick Window）
   - 4.3 独立分离视口窗口（Detached Window）
5. [核心交互模块专项 Prompt](#5-核心交互模块专项-prompt)
   - 5.1 右侧全局控制栏核心枢纽（Right Control Hub）
   - 5.2 底部一键四发广播发送栏（Bottom Multi-Send Bar）
   - 5.3 视口发光分割条与迷你操作栏（Splitter & Viewport Header）
6. [6 套预设主题皮肤与色彩规范 Prompt](#6-6-套预设主题皮肤与色彩规范-prompt)
7. [全分辨率矩阵与智能抗折叠排版规范](#7-全分辨率矩阵与智能抗折叠排版规范)
8. [设计系统 Design Tokens（可直接注入代码）](#8-设计系统-design-tokens可直接注入代码)

---

## 1. Prompt 概述与使用指南

### 适用工具
- **代码与交互原型生成**：v0.dev、Claude 3.7/Sonnet Artifacts、Bolt.new、Cursor、Lovable
- **UI 视觉与效果图生成**：Midjourney v6、Dribbble AI、Figma AI、Flux Pro
- **前端工程师还原基准**：直接作为 React + Tailwind CSS + CSS Variables 组件实现的样式规范

---

## 2. 全景大师级设计 Prompt（中文完整版）

```text
【产品定位与角色】
你是一名资深顶级桌面应用 UI/UX 设计师（精通 Apple macOS 与 Windows 11 Fluent 现代设计哲学）。
请为一款高性能多 AI 协同桌面工作台「aimux（Modern AI Workspace）」设计完整的主界面原型。该软件支持在单一工作台内同屏并发运行 1~4 个独立 AI 视口（ChatGPT、Claude、DeepSeek、Gemini），支持一键四发 Prompt 广播、全局极速悬浮窗唤出、皮肤主题深度定制与全分辨率自适应。

【核心视觉风格与设计语言】
1. 材质与视觉基调：
   - 风格：现代玻璃拟态（Modern Glassmorphism）与 Windows 11 Mica / Acrylic 材质融合；
   - 默认主题：Dark Obsidian（黑曜石暗黑主题），背景为深沉优雅的深蓝灰黑色 (rgba(18, 18, 24, 0.85))；
   - 通透质感：全局支持背景毛玻璃虚化 (backdrop-filter: blur(20px) saturate(180%))；
   - 边框与光晕：全界面采用 1px 细微光泽发光轮廓 (rgba(255, 255, 255, 0.08))，卡片圆角 10px，阴影呈现深层桌面悬浮感 (box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4))；
   - 主强调色：科技蓝 (#3B82F6)，辅助高光：青色 (#06B6D4) 与柔白 (#F3F4F6)。

【界面全景布局（三面板 + 顶部无边框栏 + 底部广播栏）】
1. 顶部自定义无边框 Header（高度 44px）：
   - 左侧：品牌 Logo（极客风格 AI 几何图标）与 "aimux" 渐变标题；右侧紧接可拖拽排序的多 Tab 标签栏（含 ChatGPT、Claude、DeepSeek 标签，包含模型 Favicon、绿/蓝色在线状态点、标题、关闭叉号以及「+」新建 Tab 按钮）；
   - 中间：分辨率预设快捷切换下拉框（当前激活显示 "2K 黄金比例 1600×1000"，展开后可见 1080P/4K/带鱼屏规格）；
   - 右侧：视口模式快速切换图标组（单视口 [1]、双分栏 [2]、四宫格 [4]、带鱼屏四列 [1x4]、主辅 1+3）、窗口置顶 Pin 开关、控制栏折叠按钮以及最小化/最大化/关闭按钮。

2. 中央主工作区（Main Viewport Area）：
   - 当前呈现「2×2 四宫格同屏布局」，展示 4 个独立的原生 AI 视口；
   - 左上视口为 ChatGPT，右上视口为 Claude，左下视口为 DeepSeek，右下视口为 Gemini；
   - 每个视口均拥有精致的卡片化顶部迷你控制条（高 28px）：模型名称徽章、独立刷新按钮、智能缩放比例指示器（如 "Zoom 85%"）、独立分离窗口按钮（Detach Icon）；
   - 四视口交汇处具备优雅的十字交叉微光可拖拽分割条（Splitter），悬停时发光加深，支持按住实时调整各视口比例；
   - 各视口内部展示桌面版完整 AI 对话视图，无移动端挤压变形。

3. 底部悬浮式 Prompt 广播栏（Bottom Multi-Send Dock，高度 84px）：
   - 底部悬浮式毛玻璃药丸形 Dock 容器，居中放置自适应宽度的 Prompt 输入框；
   - 输入框左侧：Prompt 本地知识库快速拾取按钮 (Ctrl+Shift+P)、网络搜索增强开关、清空按钮；
   - 输入框右侧：当前已连接并参与广播的模型状态徽章群（4 个彩色指示灯），以及带霓虹发光外轮廓与科技质感的「一键四发广播 (Ctrl+Enter)」按钮；
   - 鼠标悬停在广播按钮时，4 个视口的外边框同时产生柔和的同源光晕呼吸动效。

4. 右侧全局控制栏核心枢纽（Right Control Hub，宽度 260px，半透明抽屉）：
   - 模块一【布局与视口矩阵】：卡片化展示 1 窗、2 窗、4 宫格、1x4 宽列布局切换；
   - 模块二【协同模型池】：复选列表展示 ChatGPT、Claude、DeepSeek、Gemini、Kimi、Perplexity，支持一键勾选进入同屏；
   - 模块三【外观与皮肤中心】：6 款预设主题切换色卡（黑曜石、纯白、赛博朋克、深海蓝、落日、苍翠），附带窗口透明度滑块（70%~100%）、毛玻璃模糊度滑块（0~40px）与强调色拾色器；
   - 模块四【窗口预设与快捷键】：提供 1080P/2K/4K 快速吸附与快捷键录制器入口。

【排版与视觉细节要求】
- 字体：Inter / -apple-system / 'Segoe UI'，字阶层次分明，标签与快捷键提示采用等宽微型 Badge（如 Kbd 标签）；
- 动效意向：所有按钮悬停带有 150ms 柔和过渡，毛玻璃光影自然，严禁高饱和杂乱色彩，整体散发如同苹果与微软现代生产力工具的轻奢通透与极客质感。
```

---

## 3. Master UI Generation Prompt（English Version）

> **Optimal for Midjourney v6, Dribbble AI, Figma AI, or v0.dev**

```text
Professional UI/UX mockup of a modern, multi-window AI desktop workspace application named "aimux", sleek modern glassmorphism design language with Windows 11 Fluent Mica and macOS frosted glass aesthetics. 

Overall Canvas: Frameless dark obsidian desktop window (rgba(18, 18, 24, 0.85)) with deep backdrop blur, subtle luminous 1px border glow (rgba(255, 255, 255, 0.08)), rounded window corners (10px), elegant floating drop shadow.

Layout Structure:
1. Top Custom Frameless Header (44px height): Left branded logo with "aimux" title, sleek multi-tab bar (ChatGPT, Claude, DeepSeek tabs with favicons, active glow and close icons, plus a '+' button). Center resolution preset selector dropdown ('2K Golden Ratio 1600x1000'). Right layout quick-toggle icons (1-view, split-2, 2x2 grid, 1x4 ultrawide), pin-to-top toggle, frameless minimize/maximize/close buttons.
2. Central Multi-Viewport Grid: Showing a 2x2 grid with 4 independent AI chat viewports (ChatGPT, Claude, DeepSeek, Gemini). Each viewport has an ultra-clean header strip with model badge, reload button, 'Zoom 85%' adaptive indicator, and a 'Detach' pop-out window icon. Thin luminous cross-splitter dividers between viewports with hover glow.
3. Bottom Floating Multi-Send Dock (84px height): Frosted glass pill-shaped input bar floating above the bottom. Wide rich prompt textarea, quick prompt library picker, model recipient badges, and an electric-blue luminous 'Broadcast Send (Ctrl+Enter)' neon action button.
4. Right Global Control Panel (260px width translucent sidebar): Visual layout cards, AI model checklist with status dots, 6 preset skin palette cards (Dark Obsidian, Light Pure, Cyberpunk Neon, Midnight Blue, Sunset Glow, Forest Sage), opacity and backdrop blur sliders, and settings button.

Visual Mood: Hyper-minimalist, high-tech productivity, clean sans-serif typography (Inter), ultra-delicate glowing borders, Apple macOS meets Windows 11 Mica, 8K resolution, trending on Dribbble, award-winning UI design. --ar 16:10 --stylize 250
```

---

## 4. 三大独立窗口专项设计 Prompt

### 4.1 主工作台窗口（Shell Main Workspace）
```text
【窗口角色】主工作台 Shell 窗口 (1600 × 1000 默认尺寸)
【视觉表现】
- 无边框透明外壳，背景使用 backdrop-filter: blur(20px) saturate(180%)；
- 顶部 Header 高 44px，支持拖拽窗口；
- 客户区内嵌 1~4 个独立 Webview 视口卡片，视口之间有 4px 的可拖拽微光分割线；
- 侧边折叠抽屉收纳右侧全局控制栏；
- 底部悬浮 Quick Dock 广播栏，整体呈现如同一个高度集成的现代 AI 操作系统。
```

### 4.2 全局极速 AI 悬浮窗（Spotlight Quick Window）
```text
【窗口角色】系统级全局快捷键 (Alt+Space) 呼出的极速 AI 悬浮窗
【尺寸与样式】
- 尺寸：720 × 420 像素，居中悬浮于当前屏幕中央；
- 外观：超通透深色毛玻璃 (Backdrop Blur 30px，背景透明度 80%)，12px 圆角，外围环绕 1px 霓虹微弱光晕与柔和高斯弥散投影；
- 窗口状态：始终置顶 (AlwaysOnTop)，无操作系统任务栏图标。

【组件布局】
1. 顶部微型栏：
   - 左侧：极简 Sparkle AI 闪烁图标与 "Spotlight AI" 标题；
   - 右侧：Pin 锁定图钉（激活时高亮常驻，不激活时失焦自动隐藏）、放大转为主工作台图标、Esc 关闭指示。
2. 中部输入核心：
   - 无边框自适应大输入框，默认自动聚焦；
   - 占位提示符："输入 Prompt，按下 Ctrl+Enter 一键广播到所有勾选模型..."；
   - 支持多行自动撑高，右下角带有字符统计。
3. 底部模型选择与操作栏：
   - 模型多选胶囊群：[✓] ChatGPT  [✓] Claude  [✓] DeepSeek  [✓] Gemini，点击即可独立切除或加入；
   - 右侧操作按钮：带微光的「广播发送」药丸按钮，附带热键徽章 "Ctrl+↵"。
```

### 4.3 独立分离视口窗口（Detached Window）
```text
【窗口角色】从主工作台通过“分离 (Detach)”弹出的独立顶层 AI 视口
【视觉与功能】
- 针对多显示器（副屏/竖屏）设计的全功能独立桌面窗口；
- 顶部自带紧凑型标题栏：模型标识、网址输入/显示框、刷新/后退/前进按钮、Zoom 缩放控制（- / + / 重置）、以及「合并回主工作台 (Re-attach)」按钮；
- 拥有独立窗口句柄与任务栏图标，可独立最大化或吸附到副屏幕任一部分。
```

---

## 5. 核心交互模块专项 Prompt

### 5.1 右侧全局控制栏核心枢纽（Right Control Hub）
```text
【设计目标】设计宽 260px 的半透明毛玻璃抽屉面板，作为软件的核心操控枢纽。
【包含组件】
1. 布局选择器（Layout Selector）：
   - 网格平铺展示 5 款布局图形化微缩卡片（单窗、双窗50/50、四宫格2x2、1x4列、1主3辅），激活项具有发光主色边框；
2. AI 协同模型矩阵（Active Models）：
   - 垂直列表展示 ChatGPT、Claude、DeepSeek、Gemini、Kimi；每个模型带有彩色 Logo、在线绿点、独立会话标签与勾选 Checkbox；
3. 皮肤与主题中心（Theme & Skin）：
   - 6 套预设皮肤的主题色谱小卡片预览；
   - 交互滑块组：透明度滑块（70% - 100%）、高斯模糊滑块（0px - 40px）、强调色圆环拾色器；
4. 分辨率预设快捷面板：
   - 1080P/2K/4K/带鱼屏常见尺寸标签，点击窗口即时平滑调整大小；
5. 快捷键与设置按钮：
   - 底部常驻「系统设置」与「快捷键录制」入口按钮。
```

### 5.2 底部一键四发广播发送栏（Bottom Multi-Send Bar）
```text
【设计目标】设计高 84px 的悬浮式毛玻璃 Prompt 广播底栏 Dock。
【包含组件】
- 容器：半透明圆角矩形，悬浮于主工作区底部，左右居中对齐；
- 文本域：多行弹性输入框，支持 Shift+Enter 换行；
- 状态指示：动态显示 "正在向 4 个活跃视口广播" 的徽章动画；
- 按钮组：
  - 提示词库抽屉快捷按钮 (Ctrl+Shift+P)；
  - 增强网络搜索 (Web Search) 开关；
  - 发送按钮：醒目的科技蓝/青色渐变高光按钮，文案 "广播发送 (Ctrl+Enter)"。
```

### 5.3 视口发光分割条与迷你操作栏（Splitter & Viewport Header）
```text
【设计目标】设计视口之间的可拖拽交互分割条与每个视口的迷你控制栏。
【视觉表现】
- 分割条（Splitter）：宽 4px，平时呈现微透明深灰线；当鼠标悬停或按住拖拽时，分割线整体迸发柔和的 Accent 蓝色高光，中心浮现平滑拖拽手柄与实时像素尺寸气泡提示；
- 视口控制栏（Viewport Header）：高度 28px，位于每个 AI 视口内部顶端；包含模型名称微型 Badge、当前网页安全锁图标、动态 Zoom 缩放百分比（如 "85%"）、刷新图标与右上角“分离窗口”图标。
```

---

## 6. 6 套预设主题皮肤与色彩规范 Prompt

向 UI 设计工具中定义以下 6 款设计师调色主题：

| 主题名称 | 风格定位 | 背景底色与渐变 | 主强调色 (Accent) | 边框与光晕样式 |
|---|---|---|---|---|
| **1. Dark Obsidian (经典黑曜)** | 极客专注暗黑 | `rgba(18, 18, 24, 0.85)` | `#3B82F6` (科技蓝) | `rgba(255, 255, 255, 0.08)` 细腻发光边 |
| **2. Light Pure (轻灵纯白)** | 极简清新明亮 | `rgba(248, 250, 252, 0.88)` | `#2563EB` (深宝蓝) | `rgba(0, 0, 0, 0.06)` 柔和漫反射投影 |
| **3. Cyberpunk Neon (赛博霓虹)** | 极客电竞酷炫 | `rgba(13, 10, 26, 0.88)` | `#06B6D4` (青) / `#EC4899` (粉) | 青粉双色渐变发光轮廓 |
| **4. Midnight Blue (极夜深海)** | 商务深邃优雅 | `rgba(15, 23, 42, 0.85)` | `#38BDF8` (天蓝色) | `rgba(56, 189, 248, 0.15)` 幽蓝弱光 |
| **5. Sunset Glow (暮色落日)** | 温暖艺术微光 | `rgba(28, 18, 24, 0.85)` | `#F97316` (珊瑚橘) | `rgba(249, 115, 22, 0.18)` 暖橘渐变光 |
| **6. Forest Sage (深林苍翠)** | 护眼自然静谧 | `rgba(14, 24, 20, 0.85)` | `#10B981` (翡翠绿) | `rgba(16, 185, 129, 0.15)` 墨绿微光 |

---

## 7. 全分辨率矩阵与智能抗折叠排版规范

在界面设计与原型制作中，需体现针对不同屏幕规格的自适应排版逻辑：

1. **1080P FHD (1920×1080) 与小屏笔记本**：
   - 推荐尺寸：`1440×900`（居中）或 `1920×1080`（全屏）；
   - **智能抗折叠缩放**：视口宽度 $<850\text{px}$ 时，自动显示 `Zoom 78%` 缩放指示，确保 ChatGPT 等站点保持完整的桌面端两栏布局，**严禁呈现移动端汉堡菜单折叠抽屉**。
2. **2K QHD (2560×1440)**：
   - 推荐尺寸：`1600×1000`（黄金比例）或 `2560×1440`（全屏）；
   - 四宫格模式下单视口宽度 $>850\text{px}$，保持 `Zoom 100%`，字体排版舒展呼吸感强。
3. **4K UHD (3840×2160)**：
   - 推荐尺寸：`2560×1600` 或 `3840×2160`（全屏）；
   - 支持 Retina 高分屏超细腻文字与超宽 1×4 四列平铺。
4. **21:9 / 32:9 超宽带鱼屏**：
   - 推荐横向并排 1×4 列或 1×5 列，多大模型同台一览无余。

---

## 8. 设计系统 Design Tokens（可直接注入代码）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "name": "aimux-design-tokens",
  "version": "1.0.0",
  "typography": {
    "fontFamily": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    "fontMono": "JetBrains Mono, Fira Code, monospace",
    "fontSize": {
      "xs": "11px",
      "sm": "12px",
      "base": "14px",
      "lg": "16px",
      "xl": "18px",
      "2xl": "22px"
    }
  },
  "dimensions": {
    "headerHeight": "44px",
    "viewportHeaderHeight": "28px",
    "bottomDockHeight": "84px",
    "rightSidebarWidth": "260px",
    "splitterWidth": "4px",
    "spotlightWidth": "720px",
    "spotlightHeight": "420px"
  },
  "radii": {
    "window": "10px",
    "card": "8px",
    "dock": "14px",
    "spotlight": "12px",
    "pill": "9999px"
  },
  "effects": {
    "backdropBlur": "blur(20px) saturate(180%)",
    "spotlightBlur": "blur(30px) saturate(190%)",
    "shadowWindow": "0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-glow)",
    "shadowDock": "0 12px 36px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--border-glow)",
    "transitionFast": "all 150ms cubic-bezier(0.4, 0, 0.2, 1)"
  },
  "themeTokens": {
    "darkObsidian": {
      "bgPrimary": "rgba(18, 18, 24, 0.85)",
      "bgPanel": "rgba(26, 26, 36, 0.75)",
      "accent": "#3B82F6",
      "borderGlow": "rgba(255, 255, 255, 0.08)",
      "textMain": "#F3F4F6",
      "textMuted": "#9CA3AF"
    },
    "cyberpunkNeon": {
      "bgPrimary": "rgba(13, 10, 26, 0.88)",
      "bgPanel": "rgba(23, 18, 43, 0.75)",
      "accent": "#06B6D4",
      "glow": "#EC4899",
      "borderGlow": "rgba(6, 182, 212, 0.3)",
      "textMain": "#EC4899",
      "textMuted": "#06B6D4"
    },
    "midnightBlue": {
      "bgPrimary": "rgba(15, 23, 42, 0.85)",
      "bgPanel": "rgba(30, 41, 59, 0.75)",
      "accent": "#38BDF8",
      "borderGlow": "rgba(56, 189, 248, 0.15)",
      "textMain": "#F8FAFC",
      "textMuted": "#94A3B8"
    },
    "sunsetGlow": {
      "bgPrimary": "rgba(28, 18, 24, 0.85)",
      "bgPanel": "rgba(43, 27, 36, 0.75)",
      "accent": "#F97316",
      "borderGlow": "rgba(249, 115, 22, 0.18)",
      "textMain": "#FFF7ED",
      "textMuted": "#FDBA74"
    },
    "forestSage": {
      "bgPrimary": "rgba(14, 24, 20, 0.85)",
      "bgPanel": "rgba(22, 38, 31, 0.75)",
      "accent": "#10B981",
      "borderGlow": "rgba(16, 185, 129, 0.15)",
      "textMain": "#ECFDF5",
      "textMuted": "#6EE7B7"
    },
    "lightPure": {
      "bgPrimary": "rgba(248, 250, 252, 0.88)",
      "bgPanel": "rgba(255, 255, 255, 0.8)",
      "accent": "#2563EB",
      "borderGlow": "rgba(0, 0, 0, 0.08)",
      "textMain": "#0F172A",
      "textMuted": "#64748B"
    }
  }
}
```

