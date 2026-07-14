# BakaMusic Theme Spec v2.1

**契约 ID：** `bakamusic-theme@2`

**规范修订：** `2.1`（新增全组件语义 token，不更换包契约 ID）

**边界：** 客户端拥有结构、布局、层级、显隐和行为；主题拥有颜色、表面、边框、阴影、模糊、背景和小圆角。

## 1. 包结构

```text
my-theme/
  config.json
  index.css
  imgs/…
  iframes/app.html   # 可选，仅背景
```

`config.json` 与 `index.css` 必填。客户端安装和每次加载时都会重新校验，仓库 CI 通过不代表可以绕过客户端契约。

## 2. config.json

```json
{
  "spec": "bakamusic-theme@2",
  "name": "示例主题",
  "author": "someone",
  "version": "2.1.0",
  "preview": "@/imgs/preview.jpg",
  "description": "一句话描述",
  "tags": ["暗色"],
  "scheme": "dark",
  "iframe": { "app": "@/iframes/app.html" }
}
```

| 字段 | 要求 |
|---|---|
| `spec` | 必须为 `bakamusic-theme@2` |
| `name` / `author` / `description` | 必填非空字符串 |
| `version` | 必填 `x.y.z` |
| `preview` | 必填 `@/…` 包内路径或十六进制颜色 |
| `tags` | 必填 1–5 个仓库标签 |
| `scheme` | 必填 `light` 或 `dark`，必须与 CSS 一致 |
| `iframe` | 可选，只允许本地 `app` 槽位 |
| `authorUrl` | 可选作者主页 |
| `id` | 禁止；仅由仓库 `meta.json` 管理 |

## 3. CSS 语法边界

`index.css` **必须且只能**有一个 `:root` 规则：

```css
:root {
    --theme-primary: #5ee2d4;
    --theme-bg: rgba(94, 226, 212, 0.12);
    --theme-text: #111;
    --theme-scheme: light;
}
```

- 禁止任何客户端 selector、`@import`、`!important` 和额外规则。
- 禁止 MusicFree / 客户端私有变量（如 `--primaryColor`、`--appSurface`）。
- token 值中的 `var()` 只能引用本规范的其他 `--theme-*` token。
- `@/` 只能引用当前主题包内资源，不能使用 `../` 越界。
- 客户端会解析声明并重建一份规范化 CSS，而不是直接注入原文件。

## 4. Token 契约

完整机器可读清单在客户端 `src/shared/themepack/contract.ts`，主题仓库镜像为 `theme-contract.json`；每个可自定义项的人工说明见 [`THEME_TOKENS.md`](./THEME_TOKENS.md)。

### 4.1 必填基础

| Token | 含义 |
|---|---|
| `--theme-primary` | 品牌 / 强调色 |
| `--theme-bg` | 应用背景，可半透明以透出壁纸 / iframe |
| `--theme-text` | 主文字 |
| `--theme-scheme` | `light` / `dark` |

### 4.2 基础与状态

`--theme-primary-hover`、`--theme-primary-active`、`--theme-text-secondary`、
`--theme-text-muted`、`--theme-text-on-primary`、`--theme-header-text`、
`--theme-link`、`--theme-success`、`--theme-warning`、`--theme-danger`、
`--theme-info`、`--theme-divider`、`--theme-mask`、`--theme-placeholder`。

### 4.3 通用表面与交互

`--theme-surface`、`--theme-surface-strong`、`--theme-surface-muted`、
`--theme-surface-border`、`--theme-surface-border-strong`、`--theme-shadow`、
`--theme-shadow-soft`、`--theme-interactive`、`--theme-interactive-hover`、
`--theme-interactive-active`、`--theme-page-bg`、`--theme-card-bg`、
`--theme-card-bg-hover`、`--theme-card-border`。

### 4.4 标题栏与搜索

`--theme-header-bg`、`--theme-header-border`、`--theme-header-control-bg`、
`--theme-header-control-hover-bg`、`--theme-header-search-bg`、
`--theme-header-search-border`。

### 4.5 侧栏

`--theme-sidebar-bg`、`--theme-sidebar-text`、`--theme-sidebar-text-secondary`、
`--theme-sidebar-text-muted`、`--theme-sidebar-border`、
`--theme-sidebar-item-hover`、`--theme-sidebar-item-active`、
`--theme-sidebar-item-active-border`。

### 4.6 播放栏

`--theme-player-bg`、`--theme-player-bg-alt`、`--theme-player-text`、
`--theme-player-text-secondary`、`--theme-player-accent`、
`--theme-player-text-on-accent`、`--theme-player-border`。

### 4.7 列表、面板与输入

- 列表：`--theme-list-bg`、`--theme-list-row-bg`、`--theme-list-row-alt-bg`、`--theme-list-row-hover-bg`、`--theme-list-row-active-bg`、`--theme-list-row-border`
- 面板 / 模态：`--theme-panel-bg`、`--theme-panel-text`、`--theme-panel-text-secondary`、`--theme-panel-border`、`--theme-panel-row-bg`、`--theme-panel-row-hover-bg`、`--theme-panel-row-border`
- 输入：`--theme-input-bg`、`--theme-input-bg-hover`、`--theme-input-border`、`--theme-input-border-active`
- 浮层：`--theme-popover-bg`、`--theme-popover-text`、`--theme-popover-text-secondary`、`--theme-popover-border`

### 4.8 音乐详情页

`--theme-detail-text`、`--theme-detail-text-secondary`、`--theme-detail-surface`、
`--theme-detail-surface-hover`、`--theme-detail-border`、`--theme-detail-accent`。

封面模糊流光背景、暗色衬底及覆盖光效属于客户端行为，主题不能关闭或替换。
早期 2.1 包中的 `--theme-detail-bg`、`--theme-detail-overlay` 仅为加载兼容而接受，客户端不再消费。

### 4.9 背景、滚动条与圆角

`--theme-blur`、`--theme-bg-image`、`--theme-scrollbar-track`、
`--theme-scrollbar-thumb`、`--theme-scrollbar-thumb-hover`、
`--theme-scrollbar-thumb-active`、`--theme-radius-control`、
`--theme-radius-card`、`--theme-radius-panel`、`--theme-radius-cover`。

`--theme-surface-alpha` 为 2.0 兼容提示（`0`–`1`）；新主题应直接声明所需 surface token。

## 5. 默认派生

除四个必填 token 外均可省略。客户端会从基础色派生可读默认值；主题若要精确控制某个区域，只覆盖对应语义 token：

```css
:root {
    --theme-primary: #5ee2d4;
    --theme-bg: rgba(94, 226, 212, 0.12);
    --theme-text: #111;
    --theme-scheme: light;

    --theme-header-bg: var(--theme-bg);
    --theme-sidebar-bg: var(--theme-bg);
    --theme-player-bg: var(--theme-bg);
    --theme-panel-bg: rgba(94, 226, 212, 0.82);
    --theme-detail-surface: rgba(94, 226, 212, 0.2);
}
```

这替代旧主题对 `.header-container`、`.sidebar-container`、`.music-bar-container` 等 class 的逐点覆盖。

## 6. 动态背景

- 只允许 `iframe.app`，路径必须是 `@/iframes/*.html`。
- iframe 使用 `sandbox="allow-scripts"`，不能访问父页面 DOM。
- HTML 仅渲染背景媒体，资源继续使用 `@/imgs/…`。
- 含 iframe 的主题必须包含「动态」标签。

## 7. 客户端与主题职责

| 客户端 | 主题 |
|---|---|
| DOM、布局、尺寸、层级、响应式 | 颜色与表面 |
| glass / flat 结构语言、玻璃播放栏封面动态取色 | 各区域语义 token |
| 详情页封面流光背景与覆盖光效 | 详情页文字、控件和面板表面 |
| auto-hide、详情页不透底、面板行为 | 壁纸 / 沙箱背景 iframe |
| CSS 解析、token 白名单、路径校验 | 合法 `:root` 声明 |

主题不得隐藏控件、修改尺寸、改变定位或针对版本 class 打补丁；客户端不得再为某个具体主题添加 selector workaround。

## 8. 仓库发布架构

继续保留双分支，以隔离可审查源码和机器产物：

| 分支 | 内容 |
|---|---|
| `v2/source` | `themes/*`、规范镜像、校验与发布脚本；PR 目标 |
| `v2/prod` | `publish.json`、`.mftheme`、预览资源；仅 CI 写入 |

客户端市场源：

推荐使用以下 GitHub 加速源：

```text
https://gh.xmly.dev/https://raw.githubusercontent.com/Toskysun/BakaThemePacks/v2/prod/
https://gh-proxy.org/https://raw.githubusercontent.com/Toskysun/BakaThemePacks/v2/prod/
```

GitHub 原始地址作为回退：

```text
https://raw.githubusercontent.com/Toskysun/BakaThemePacks/v2/prod/
```

## 9. 版本兼容

- `bakamusic-theme@2`：当前唯一可安装契约。
- 补齐当前必填配置（包括 `scheme`）的 2.0 token 包仍可加载，并由客户端派生新增语义 token。
- 主题市场现有主题统一升级为 `2.1.0` 并显式覆盖主要区域。
- v1 / MusicFree selector 主题不会被注入，需迁移或从市场重装。
