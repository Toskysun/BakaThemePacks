# BakaMusic 主题包仓库

[BakaMusic](https://github.com/Zencok/BakaMusic) 的官方主题市场源。

**当前契约：`bakamusic-theme@2`，语义修订：`2.1`**
原则：**客户端定结构与产品视觉行为，主题通过公开 token 绘制可主题化区域 + 可选背景资源。**

---

## 文档导航

| 文档 | 内容 |
|------|------|
| **[docs/THEME_GUIDE.md](./docs/THEME_GUIDE.md)** | **完整主题包写作教程**（结构、token、动态背景、校验、上架） |
| **[docs/THEME_TOKENS.md](./docs/THEME_TOKENS.md)** | **全部 91 个可自定义 token 的作用与覆盖区域** |
| [docs/theme-spec-v2.md](./docs/theme-spec-v2.md) | V2.1 规范、包格式与客户端/主题职责边界 |
| [docs/theme-coverage-v2.md](./docs/theme-coverage-v2.md) | 公开 token 到客户端覆盖点位审查表 |
| [$create-baka-theme](./.agents/skills/create-baka-theme/SKILL.md) | 一键创建、补齐语义层并校验新主题的仓库 Skill |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献 / PR 流程摘要 |
| [config.schema.json](./config.schema.json) | `config.json` JSON Schema |
| [theme-contract.json](./theme-contract.json) | 完整公开 token 机器清单 |
| [tags.json](./tags.json) | 可用标签列表 |

> 第一次写主题？直接打开 → **[完整写作教程](./docs/THEME_GUIDE.md)**

---

## 分支说明

| 分支 | 说明 |
|------|------|
| `v2/source` | 源代码（**PR 提交目标**） |
| `v2/prod` | CI 自动生成的市场产物（`publish.json`、`.mftheme`、预览图）**请勿手改** |

客户端主题市场默认拉取：

```text
https://raw.githubusercontent.com/Toskysun/BakaThemePacks/v2/prod/
```

---

## 使用 `$create-baka-theme`（推荐给主题作者）

仓库内置了面向用户的主题生成 Skill：[`create-baka-theme`](./.agents/skills/create-baka-theme/SKILL.md)。在 `v2/source` 仓库目录中打开支持仓库 Skill 的 Codex/Agent，直接输入：

```text
请使用 $create-baka-theme 创建一个深色极光主题，名称 Aurora Night，作者 Baka，主色 #65e7d2。
```

Skill 会自动：

1. 创建 `themes/<slug>/config.json` 与 `index.css`
2. 填入完整 V2.1 语义覆盖层
3. 根据 `tags.json` 生成合法标签
4. 只校验新主题，不改 `meta.json` 或 `v2/prod`

不使用 Agent 时，也可以直接运行同一套生成器：

```bash
python .agents/skills/create-baka-theme/scripts/create_theme.py \
  --slug aurora-night --name "Aurora Night" --author "Baka" \
  --scheme dark --primary "#65e7d2"
```

生成后按需求修改主题目录；所有可修改项见 **[完整 Token 表](./docs/THEME_TOKENS.md)**。

---

## 五分钟上手

### 1. 目录骨架

```text
themes/my-theme/
├── config.json
├── index.css
└── imgs/
    └── preview.jpg
```

### 2. config.json

```json
{
  "spec": "bakamusic-theme@2",
  "name": "我的主题",
  "author": "你的名字",
  "version": "2.1.0",
  "preview": "@/imgs/preview.jpg",
  "description": "一句话描述",
  "tags": ["亮色"],
  "scheme": "light"
}
```

### 3. index.css（只写 token）

```css
/* bakamusic-theme@2 */
:root {
  --theme-primary: #f17d34;
  --theme-bg: #fdfdfd;
  --theme-text: #333333;
  --theme-scheme: light;
}
```

### 4. 本地校验

```bash
npm ci
npm run validate -- --themes my-theme
```

### 5. 本地安装试玩

将主题文件夹打成 zip，后缀改为 `.mftheme`，在 BakaMusic → 主题 → 本地 →「+」安装。

### 6. 上架

Fork → 改 `themes/` → 校验通过 → 向 **`v2/source`** 提 PR。

全部 token 见 **[完整 Token 表](./docs/THEME_TOKENS.md)**；动态视频背景、体积限制、迁移旧主题和检查清单见 **[完整教程](./docs/THEME_GUIDE.md)**。

---

## 在客户端安装主题

1. **主题市场**：打开 BakaMusic → 主题 → 在线，一键下载（依赖 `v2/prod`）
2. **本地文件**：安装 `.mftheme` / zip（必须 `spec: bakamusic-theme@2`）

旧版无 `spec`、或使用 `--primaryColor` / class 覆盖的包，**新版客户端不会应用**。

---

## 仓库脚本

```bash
npm run validate          # 校验全部主题
npm run validate:theme -- --themes <name>
npm run publish           # 本地打发布产物（一般由 CI 执行）
npm run migrate:v2        # 批量迁移 MusicFree --color-* 旧 token
npm run upgrade:semantic  # 为旧 V2 包补齐 2.1 主要区域 token
```

---

## 设计原则（务必读）

| 应该做 | 不要做 |
|--------|--------|
| 只写清单内 `--theme-*` | 选择 `.music-bar-container` 等客户端 class |
| 用半透明 `--theme-bg` 透视频 | 用 `!important` 扫全站毛玻璃 |
| 用 header/sidebar/player/detail 等语义 token | 引用 `--appSurface` 等私有变量 |
| `iframe.app` 只播背景 | 改 `--appHeaderHeight` 等布局 |
| 标签来自 `tags.json` | 在 config 里写 `id` |
| 压图 ≤500KB、视频 ≤5MB | 提交 4K 原片 |

---

## 许可证

[GPL-3.0](./LICENSE)（若仓库未附 LICENSE 文件，以 GitHub 显示的许可证为准）

## 相关项目

- 客户端：[Zencok/BakaMusic](https://github.com/Zencok/BakaMusic)
- 主题市场产物：本仓库 `v2/prod` 分支
