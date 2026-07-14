# BakaMusic 主题包仓库

[BakaMusic](https://github.com/Toskysun/BakaMusic) 的官方主题市场源。

**当前契约：`bakamusic-theme@2`**  
原则：**客户端定布局，主题只填色（token）+ 可选背景资源。**

---

## 文档导航

| 文档 | 内容 |
|------|------|
| **[docs/THEME_GUIDE.md](./docs/THEME_GUIDE.md)** | **完整主题包写作教程**（结构、token、动态背景、校验、上架） |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献 / PR 流程摘要 |
| [config.schema.json](./config.schema.json) | `config.json` JSON Schema |
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
  "version": "2.0.0",
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

更细的 token 列表、动态视频背景、体积限制、迁移旧主题、检查清单，见 **[完整教程](./docs/THEME_GUIDE.md)**。

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
```

---

## 设计原则（务必读）

| 应该做 | 不要做 |
|--------|--------|
| 只写 `--theme-*` | 选择 `.music-bar-container` 等客户端 class |
| 用半透明 `--theme-bg` 透视频 | 用 `!important` 扫全站毛玻璃 |
| `iframe.app` 只播背景 | 改 `--appHeaderHeight` 等布局 |
| 标签来自 `tags.json` | 在 config 里写 `id` |
| 压图 ≤500KB、视频 ≤5MB | 提交 4K 原片 |

---

## 许可证

[GPL-3.0](./LICENSE)（若仓库未附 LICENSE 文件，以 GitHub 显示的许可证为准）

## 相关项目

- 客户端：[Toskysun/BakaMusic](https://github.com/Toskysun/BakaMusic)  
- 主题市场产物：本仓库 `v2/prod` 分支  
