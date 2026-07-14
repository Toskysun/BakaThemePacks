# Theme v2.1 覆盖审查

本表记录公开语义层到客户端私有实现的唯一映射。新增可见区域时，应先在这里归类并使用现有 token；确有新语义才扩展 `contract.ts`，禁止给具体主题写 class 兼容规则。

| 覆盖区域 | 公开 token 组 | 客户端落点 |
|---|---|---|
| 应用画布 / 页面 | `bg`, `bg-image`, `page-bg` | `html`, `#root`, `.app-container`, `.body-container` |
| 标题栏 / 搜索 / 历史 | `header-*`, `popover-*` | `Header`, `SearchHistory`；历史面板由客户端补足不透明底层保证可读性 |
| 侧栏 / 分组 / 选中态 | `sidebar-*` | `SideBar`, `ListItem`, sheet widgets |
| 播放栏 / 控制 / 进度 | `player-*` | `MusicBar` 及 widgets；glass 下由客户端封面动态取色优先 |
| 通用卡片 / 推荐 / 专辑 / 插件 | `surface-*`, `card-*` | app surface 私有 token |
| 音乐列表 / hover / active | `list-*` | `MusicList` 私有 token |
| 设置 / 输入 / 开关 | `panel-*`, `input-*` | setting 私有 token |
| 模态 / 抽屉 / 菜单 / 音质浮层 | `panel-*`, `popover-*`, `mask` | Modal, Panel, ContextMenu, QualitySelectPopover |
| 音乐详情 / 歌词工具 | 不开放主题 token | MusicDetail、Lyric 及沉浸播放栏全部由客户端拥有 |
| 状态反馈 | `success`, `warning`, `danger`, `info` | 全局状态 token |
| 滚动条 | `scrollbar-*` | base.scss |
| 小圆角 | `radius-*` | control/card/panel/cover 可视半径 |
| 动态背景 | `iframe.app` | 沙箱 iframe；不进入组件 DOM |

## 审查结论

1. 旧的“主题 selector 覆盖 → 客户端再用 `!important` 反覆盖”链路已切断：客户端只注入白名单声明。
2. `glass` / `flat` 继续决定结构与尺寸；`theme-bridge.scss` 最后统一接管颜色和效果。
3. 完整播放详情页、播放栏 auto-hide 及 glass 播放栏封面动态取色均为产品行为；主题不参与详情页配色。
4. 市场主题显式填充主要区域 token；缺省 token 始终有客户端派生值，不再按主题名称适配。
5. 仓库校验以 `4.5:1` 主文字、`3:1` 次级文字为门禁，并在黑白极端壁纸上复核透明表面；可读性问题必须由主题 token 修正。
