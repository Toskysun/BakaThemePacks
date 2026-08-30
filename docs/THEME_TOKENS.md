# BakaMusic V2.1 可自定义 Token 全表

本页是 `bakamusic-theme@2` 的人工可读完整清单。机器白名单以仓库根目录 [`theme-contract.json`](../theme-contract.json) 为准；覆盖点位见 [`theme-coverage-v2.md`](./theme-coverage-v2.md)。

除四个必填项外均可省略，由客户端派生默认值。主题只能在唯一的 `:root` 中声明这些 token（`scheme: "system"` 主题可按规范追加唯一的深色媒体覆盖块），值中的 `var()` 也只能引用本清单内 token。

文字与承载表面的可读性由主题作者结合实际壁纸负责判断。壁纸可以透明，但承载文字的 `surface`、标题栏、侧栏、播放栏、面板与浮层不建议直接复用低透明度 `--theme-bg`。

## 1. 必填基础（4）

| Token | 作用 |
|---|---|
| `--theme-primary` | 品牌色、主按钮、进度与默认强调色 |
| `--theme-bg` | 应用基础背景；可半透明以透出主题壁纸或 iframe |
| `--theme-text` | 全局主文字色 |
| `--theme-scheme` | 对比基调，只能为 `light` 或 `dark` |

## 2. 基础、文字与状态（16）

| Token | 作用 |
|---|---|
| `--theme-primary-hover` | 主色控件 hover 状态 |
| `--theme-primary-active` | 主色控件按下状态 |
| `--theme-text-secondary` | 次级说明文字 |
| `--theme-text-muted` | 更弱的辅助、禁用或提示文字 |
| `--theme-text-on-primary` | 主色背景上的文字/图标 |
| `--theme-header-text` | 标题栏文字；通常使用 `var(--theme-text)` |
| `--theme-main-header-button-text` | 主窗口主页面右上角窗口/工具按钮文字与图标颜色；仅影响该按钮组 |
| `--theme-link` | 链接与可点击文本 |
| `--theme-success` | 成功状态 |
| `--theme-warning` | 警告状态 |
| `--theme-danger` | 危险、失败和删除状态 |
| `--theme-info` | 信息状态 |
| `--theme-divider` | 通用分割线 |
| `--theme-mask` | 模态、抽屉背后的遮罩 |
| `--theme-placeholder` | 占位图和骨架背景 |
| `--theme-surface-alpha` | `0`–`1` 的旧 V2 表面透明度提示；新主题优先直接设置表面 token |

## 3. 通用表面、交互与卡片（14）

| Token | 作用 |
|---|---|
| `--theme-surface` | 默认玻璃/面板表面；必须在任意壁纸上承载清晰主文字 |
| `--theme-surface-strong` | 更实、更强调的表面，推荐用于标题栏与设置面板 |
| `--theme-surface-muted` | 更弱的表面；仍需保留足够底色，不能等同极低 alpha 的主题背景 |
| `--theme-surface-border` | 默认表面边框 |
| `--theme-surface-border-strong` | 强调边框 |
| `--theme-shadow` | 面板/浮层主阴影，可为完整 `box-shadow` 值 |
| `--theme-shadow-soft` | 卡片与轻量浮层阴影 |
| `--theme-interactive` | 默认可交互控件底色 |
| `--theme-interactive-hover` | 普通控件 hover 底色 |
| `--theme-interactive-active` | 普通控件选中/按下底色 |
| `--theme-page-bg` | 页面内容区背景，可使用渐变 |
| `--theme-card-bg` | 卡片默认背景 |
| `--theme-card-bg-hover` | 卡片 hover 背景 |
| `--theme-card-border` | 卡片边框 |

## 4. 标题栏与搜索（6）

| Token | 作用 |
|---|---|
| `--theme-header-bg` | 顶部标题栏背景 |
| `--theme-header-border` | 标题栏边界 |
| `--theme-header-control-bg` | 标题栏按钮默认背景 |
| `--theme-header-control-hover-bg` | 标题栏按钮 hover 背景 |
| `--theme-header-search-bg` | 搜索框背景 |
| `--theme-header-search-border` | 搜索框和标题栏输入边框 |

## 5. 侧栏（8）

| Token | 作用 |
|---|---|
| `--theme-sidebar-bg` | 左侧导航背景 |
| `--theme-sidebar-text` | 侧栏主文字 |
| `--theme-sidebar-text-secondary` | 侧栏次级文字 |
| `--theme-sidebar-text-muted` | 侧栏弱提示文字 |
| `--theme-sidebar-border` | 侧栏边界 |
| `--theme-sidebar-item-hover` | 导航项 hover 背景 |
| `--theme-sidebar-item-active` | 当前导航项背景 |
| `--theme-sidebar-item-active-border` | 当前导航项强调边线 |

## 6. 底部播放栏（7）

| Token | 作用 |
|---|---|
| `--theme-player-bg` | 播放栏主表面，主要用于 flat 与无封面回退 |
| `--theme-player-bg-alt` | 播放栏第二表面/渐变端点 |
| `--theme-player-text` | 播放栏主文字和图标 |
| `--theme-player-text-secondary` | 播放栏次级信息 |
| `--theme-player-accent` | 进度、播放按钮等强调色 |
| `--theme-player-text-on-accent` | 播放栏强调按钮上的文字/图标 |
| `--theme-player-border` | 播放栏边框 |

> glass 风格下，播放栏会优先使用客户端的封面动态取色；这是产品行为。上述 token 仍用于 flat、无封面回退和相关浮层。

## 7. 列表（6）

| Token | 作用 |
|---|---|
| `--theme-list-bg` | 歌曲列表整体背景 |
| `--theme-list-row-bg` | 普通列表行背景 |
| `--theme-list-row-alt-bg` | 交替列表行背景 |
| `--theme-list-row-hover-bg` | 列表行 hover 背景 |
| `--theme-list-row-active-bg` | 当前/选中列表行背景 |
| `--theme-list-row-border` | 列表行分隔线 |

## 8. 面板与模态（7）

| Token | 作用 |
|---|---|
| `--theme-panel-bg` | 设置、模态、抽屉等面板背景 |
| `--theme-panel-text` | 面板主文字 |
| `--theme-panel-text-secondary` | 面板次级文字 |
| `--theme-panel-border` | 面板边框 |
| `--theme-panel-row-bg` | 面板内条目背景 |
| `--theme-panel-row-hover-bg` | 面板条目 hover 背景 |
| `--theme-panel-row-border` | 面板条目分隔线 |

## 9. 输入控件（4）

| Token | 作用 |
|---|---|
| `--theme-input-bg` | 输入框、选择器默认背景 |
| `--theme-input-bg-hover` | 输入控件 hover 背景 |
| `--theme-input-border` | 输入控件默认边框 |
| `--theme-input-border-active` | 聚焦/激活边框 |

## 10. 浮层（4）

| Token | 作用 |
|---|---|
| `--theme-popover-bg` | 菜单、搜索历史、音质选择等浮层背景；应使用近乎不透明或不透明颜色保证文字可读 |
| `--theme-popover-text` | 浮层主文字 |
| `--theme-popover-text-secondary` | 浮层次级文字 |
| `--theme-popover-border` | 浮层边框 |

## 11. 背景、模糊与滚动条（6）

| Token | 作用 |
|---|---|
| `--theme-blur` | glass 表面的模糊半径，如 `14px`；flat 可能不消费 |
| `--theme-bg-image` | 应用静态背景图，如 `url("@/imgs/bg.webp")` |
| `--theme-scrollbar-track` | 滚动条轨道 |
| `--theme-scrollbar-thumb` | 滚动条滑块 |
| `--theme-scrollbar-thumb-hover` | 滚动条 hover 状态 |
| `--theme-scrollbar-thumb-active` | 滚动条拖动状态 |

## 12. 小圆角（4）

| Token | 作用 |
|---|---|
| `--theme-radius-control` | 按钮、输入和小控件圆角 |
| `--theme-radius-card` | 卡片与播放栏外壳圆角 |
| `--theme-radius-panel` | 模态、抽屉和浮层圆角 |
| `--theme-radius-cover` | 专辑封面、预览图圆角 |

圆角 token 只改变小型视觉半径，不允许主题修改组件尺寸、定位或布局。

## 13. 仅兼容、不可自定义（8）

| Token | 状态 |
|---|---|
| `--theme-detail-bg` | 仅接受早期 2.1 已发布包，客户端不消费；新主题声明会被仓库校验拒绝 |
| `--theme-detail-overlay` | 仅接受早期 2.1 已发布包，客户端不消费；新主题声明会被仓库校验拒绝 |
| `--theme-detail-text` | 仅兼容旧包；播放详情页文字由客户端固定 |
| `--theme-detail-text-secondary` | 仅兼容旧包；播放详情页次级文字由客户端固定 |
| `--theme-detail-surface` | 仅兼容旧包；播放详情页面板由客户端固定 |
| `--theme-detail-surface-hover` | 仅兼容旧包；播放详情页交互表面由客户端固定 |
| `--theme-detail-border` | 仅兼容旧包；播放详情页边框由客户端固定 |
| `--theme-detail-accent` | 仅兼容旧包；播放详情页强调色由客户端固定 |

因此当前机器白名单共 94 项，其中 **86 项可自定义、8 项仅用于旧包加载兼容**。播放详情页整体属于客户端产品视觉，不接受主题控制。
