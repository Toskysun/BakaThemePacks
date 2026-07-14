# BakaMusic 主题包完整写作教程

**契约版本：** `bakamusic-theme@2`  
**适用客户端：** [BakaMusic](https://github.com/Toskysun/BakaMusic)（须支持 V2 主题系统）  
**本仓库：** 主题市场源码与发布

---

## 0. 一句话原则

> **客户端定布局与组件样式；主题只填色（token）和可选背景资源。**

你**不要**再去写 `.header-container`、`.music-bar-container`、`.sidebar-container` 这类选择器，也不要用 `!important` 去盖客户端 UI。  
正确做法：在 `index.css` 的 `:root` 里声明 `--theme-*` 变量；需要动态壁纸时再加 `iframes/app.html`。

旧版「改一堆 class + 毛玻璃扫全站」的写法已**废弃**，客户端会拒绝非 V2 包。

---

## 1. 你将得到什么

写好一个主题包后，可以：

1. **本地安装**：打包成 `.mftheme`（zip 改后缀即可）→ BakaMusic 主题页「+」安装  
2. **上架市场**：向本仓库 `v2/source` 提 PR → CI 校验 → 合并后自动发布到 `v2/prod` → 客户端主题市场可下载  

---

## 2. 包结构（必会）

每个主题是 `themes/` 下的**一个文件夹**（文件夹名仅允许字母、数字、`-`、`_`）：

```text
themes/my-cool-theme/
├── config.json          # 必填：元数据 + spec
├── index.css            # 必填：只写 --theme-* token
├── imgs/                # 推荐：预览图 / 静态壁纸 / 视频
│   ├── preview.jpg
│   └── bg.mp4           # 动态主题常用
└── iframes/             # 可选：仅动态背景
    └── app.html
```

### 2.1 路径别名 `@/`

配置和 HTML 里引用包内资源时，用 **`@/` 表示主题包根目录**：

| 写法 | 含义 |
|------|------|
| `@/imgs/preview.jpg` | `主题根/imgs/preview.jpg` |
| `@/iframes/app.html` | `主题根/iframes/app.html` |

客户端加载时会把 `@/` 替换成实际文件路径。

---

## 3. config.json（完整字段）

### 3.1 最小可用示例（静态）

```json
{
  "spec": "bakamusic-theme@2",
  "name": "夏日柠檬",
  "author": "你的名字",
  "version": "2.0.0",
  "preview": "@/imgs/preview.jpg",
  "description": "清爽浅色主题",
  "tags": ["亮色", "简约"],
  "scheme": "light"
}
```

### 3.2 动态主题示例

```json
{
  "spec": "bakamusic-theme@2",
  "name": "星河【动态】",
  "author": "你的名字",
  "authorUrl": "https://github.com/yourname",
  "version": "2.0.0",
  "preview": "@/imgs/preview.jpg",
  "description": "动态星空背景",
  "tags": ["动态", "暗色", "自然"],
  "scheme": "dark",
  "iframe": {
    "app": "@/iframes/app.html"
  }
}
```

### 3.3 字段说明

| 字段 | 必填 | 说明 |
|------|:----:|------|
| `spec` | ✅ | **必须**为字符串 `bakamusic-theme@2`，否则客户端拒绝加载 |
| `name` | ✅ | 显示名称，建议 ≤ 50 字 |
| `author` | ✅ | 作者署名 |
| `version` | ✅ | **semver**：`x.y.z`（如 `2.0.0`） |
| `preview` | ✅ | 市场缩略图：`@/imgs/...` **或** 纯色 `#RRGGBB` / `#RGB` |
| `description` | ✅ | 一句话介绍，建议 ≤ 200 字 |
| `tags` | ✅ | 1～5 个标签，**必须**来自仓库根目录 [`tags.json`](../tags.json) 的 `label` |
| `scheme` | 强烈推荐 | `light` 或 `dark`，应与 CSS 中 `--theme-scheme` 一致 |
| `iframe` | 否 | 仅允许 `{ "app": "@/iframes/xxx.html" }` |
| `authorUrl` | 否 | 作者主页（GitHub / 个人站等） |
| `id` | ❌ 禁止 | 由仓库 `meta.json` 统一管理，**不要写进 config** |
| `iframes` | ❌ 禁止 | 拼写错误，正确字段是 `iframe` |

### 3.4 标签速查

标签的 **label**（写入 `tags` 数组）包括：

`暗色` · `亮色` · `渐变` · `简约` · `动漫` · `风景` · `插画` · `赛博` · `像素` · `抽象` · `动态` · `可爱` · `游戏` · `影视` · `季节` · `自然`

规则：

- 有 `iframe`（动态背景）时，**必须**包含标签 **`动态`**  
- 最多 5 个，至少 1 个  

---

## 4. index.css（Token 契约）

### 4.1 铁律

1. **只允许**在 `:root { ... }` 里声明 **契约内的** `--theme-*` 变量  
2. **禁止**任何其它选择器（`.xxx`、`#root`、`body`、`::-webkit-scrollbar` 等）  
3. **禁止** MusicFree 旧 token：`--color-*`、`--primaryColor`、`--backgroundColor` 等  
4. **禁止**用 `!important` 去改客户端布局  
5. 客户端会把 `--theme-*` 映射成内部的表面色、标题栏、侧栏、列表等  

### 4.2 必填 Token

| Token | 含义 | 建议 |
|-------|------|------|
| `--theme-primary` | 品牌色 / 强调色（按钮高亮、进度、链接默认） | 主视觉色 |
| `--theme-bg` | 主背景色 | 可半透明，便于透出视频壁纸 |
| `--theme-text` | 主文字色 | 与背景对比度要够 |
| `--theme-scheme` | 对比基调 | 只能是 `light` 或 `dark` |

### 4.3 推荐 Token

| Token | 含义 |
|-------|------|
| `--theme-text-secondary` | 次级文字 |
| `--theme-text-on-primary` | 画在主色按钮上的文字色 |
| `--theme-header-text` | 标题栏文字（可与主文字不同，如深底浅字） |
| `--theme-link` | 链接色（默认同 primary） |
| `--theme-divider` | 分割线 |
| `--theme-mask` | 弹层遮罩 |
| `--theme-placeholder` | 占位 / 骨架色 |
| `--theme-surface-alpha` | `0`～`1`，面板不透明度提示 |
| `--theme-blur` | 玻璃模糊，如 `12px` 或 `none` |
| `--theme-bg-image` | 静态壁纸：`url("@/imgs/wall.jpg")`（动态请用 iframe） |
| `--theme-scrollbar-thumb` | 滚动条滑块色 |

### 4.4 最小合法 CSS（静态浅色）

```css
/* bakamusic-theme@2 */
:root {
  --theme-primary: #5ee2d4;
  --theme-bg: #f7fffe;
  --theme-text: #111111;
  --theme-scheme: light;
  --theme-header-text: #111111;
  --theme-blur: 14px;
  --theme-surface-alpha: 0.9;
}
```

### 4.5 深色主题示例

```css
/* bakamusic-theme@2 */
:root {
  --theme-primary: #34d399;
  --theme-bg: #202020;
  --theme-text: #fcfcfc;
  --theme-scheme: dark;
  --theme-text-secondary: #aaaaaa;
  --theme-text-on-primary: #121212;
  --theme-header-text: #fcfcfc;
  --theme-link: #34d399;
  --theme-divider: rgba(255, 255, 255, 0.1);
  --theme-mask: rgba(0, 0, 0, 0.55);
  --theme-placeholder: #424242;
  --theme-surface-alpha: 0.92;
  --theme-blur: 12px;
  --theme-scrollbar-thumb: #34d399;
}
```

### 4.6 动态主题（半透明底 + 视频）示例

动态壁纸靠 iframe 播视频；`index.css` 用**半透明** `--theme-bg`，让视频透出来，同时保证文字可读：

```css
/* bakamusic-theme@2 — 动态 */
:root {
  --theme-primary: #ff6142;
  /* 半透明：能透出 iframe 视频，又别太透导致字糊 */
  --theme-bg: rgba(255, 97, 66, 0.28);
  --theme-text: #111111;
  --theme-scheme: light;
  --theme-header-text: #ffffff;
  --theme-text-secondary: rgba(17, 17, 17, 0.68);
  --theme-blur: 12px;
  --theme-surface-alpha: 0.42;
  --theme-scrollbar-thumb: #ff6142;
}
```

**调参建议：**

| 目标 | 建议 |
|------|------|
| 视频更明显 | 降低 `--theme-bg` 的 alpha（如 `0.18`～`0.32`） |
| 字更清楚 | 提高 alpha，或把 `--theme-text` 调得更对比 |
| 毛玻璃更强 | `--theme-blur: 16px`～`22px`（客户端 glass 模式才会用） |
| 扁平模式 | 用户可在设置里切 flat；主题**不要**强行改布局 |

### 4.7 静态壁纸（无视频）

不用 iframe，在 CSS 里：

```css
:root {
  --theme-primary: #c4a574;
  --theme-bg: rgba(30, 28, 26, 0.72);
  --theme-text: #f5f0e8;
  --theme-scheme: dark;
  --theme-bg-image: url("@/imgs/wall.jpg");
  --theme-blur: 10px;
}
```

---

## 5. 动态背景 iframe（可选）

### 5.1 何时需要

- 背景是 **视频 / 动画 / Canvas**  
- 需要循环播放、调亮度等  

静态图片优先用 `--theme-bg-image`，更简单。

### 5.2 最小 app.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>theme-bg</title>
  <style>
    html, body {
      position: fixed;
      inset: 0;
      margin: 0;
      overflow: hidden;
      background: #0a0a0a;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      /* 视频太亮可调低，减轻抢字 */
      filter: brightness(0.85);
    }
  </style>
</head>
<body>
  <video autoplay loop muted playsinline>
    <source src="@/imgs/bg.mp4" type="video/mp4" />
  </video>
</body>
</html>
```

### 5.3 iframe 注意

- **只做背景**，不要依赖主窗口 class  
- 视频务必 `muted` + `autoplay` + `loop` + `playsinline`（浏览器策略）  
- 资源路径用 `@/imgs/...`  
- `config.json` 写 `"iframe": { "app": "@/iframes/app.html" }`  
- `tags` 必须含 **`动态`**  
- **不要**在主文档 `index.css` 里写视频样式  

---

## 6. 资源与体积限制（CI 会卡）

| 类型 | 上限 |
|------|------|
| 单张图片 | **≤ 500 KB** |
| 单个视频 | **≤ 5 MB** |
| 整个主题包 | **≤ 10 MB** |

### 6.1 压缩建议

**图片（预览图）：**

- 分辨率够用即可（如长边 1280）  
- 优先 JPEG / WebP  
- 工具：`ffmpeg`、Squoosh、Photoshop「导出为 Web」  

示例：

```bash
ffmpeg -y -i raw.png -vf "scale='min(1280,iw)':-2" -q:v 5 imgs/preview.jpg
```

**视频：**

- 分辨率 720p 或更低  
- 去掉音轨（`-an`）  
- 适当提高 CRF（如 32～36）  
- 循环背景可裁短时长  

示例：

```bash
ffmpeg -y -i raw.mp4 -vf "scale='min(854,iw)':-2" -c:v libx264 -preset medium -crf 32 -an -movflags +faststart imgs/bg.mp4
```

---

## 7. 本地校验（提交前必做）

在仓库根目录：

```bash
# 安装依赖（首次）
npm ci

# 校验全部主题
npm run validate

# 只校验你的主题
npm run validate -- --themes my-cool-theme
```

校验会检查：

- `spec`、必填字段、semver、标签合法性  
- `index.css` 必填 token、禁止选择器、禁止废弃 token  
- 预览文件是否存在  
- iframe 路径  
- 资源体积  

**校验不过 = 无法合并 PR。**

---

## 8. 本地安装测试（.mftheme）

1. 把主题文件夹打成 zip，保证 zip **根目录**就是 `config.json` + `index.css`（不要多套一层无关目录）  
2. 将后缀改为 `.mftheme`（或安装时选 zip）  
3. 打开 BakaMusic → 主题 → 本地 → 「+」→ 选择文件  
4. 切换 glass / flat 两种界面风格各看一遍  
5. 打开搜索历史、侧栏、播放栏、歌曲详情，确认对比度可读  

也可用任意压缩工具：

```text
my-cool-theme/
  config.json
  index.css
  imgs/...
```

打包后改名 `my-cool-theme.mftheme`。

---

## 9. 提交到本仓库（上架市场）

### 9.1 分支

| 分支 | 用途 |
|------|------|
| **`v2/source`** | 源码、PR 目标 |
| **`v2/prod`** | CI 自动生成的发布产物（**不要手改**） |

### 9.2 流程

1. Fork 本仓库  
2. 从 `v2/source` 拉分支  
3. 在 `themes/你的文件夹名/` 放入完整主题  
4. **不要**改 `meta.json` 里别人的 id；新主题的 id 由维护者/CI 处理  
5. 本地 `npm run validate -- --themes 你的文件夹名`  
6. 提 PR 到 **`v2/source`**  
7. 合并后 CI 自动打包发布到 `v2/prod`，客户端市场即可拉到  

### 9.3 文件夹命名

- 仅 `a-z` `A-Z` `0-9` `-` `_`  
- 推荐英文短名：`summer-lemon`、`night-star`  
- 显示名用 `config.name` 写中文即可  

---

## 10. 从旧版主题迁移（速查）

| 旧写法 | V2 |
|--------|-----|
| `--primaryColor` | `--theme-primary` |
| `--backgroundColor` / glass 半透明 | `--theme-bg` |
| `--textColor` | `--theme-text` |
| `--headerTextColor` | `--theme-header-text` |
| `.header-container { backdrop-filter... }` | **删除**（客户端负责） |
| `#root { background: url(...) }` | `--theme-bg-image: url("@/imgs/...")` 或 iframe |
| 无 `spec` | 必须 `"spec": "bakamusic-theme@2"` |

仓库内也有迁移脚本（维护用）：

```bash
npm run migrate:v2   # MusicFree --color-* → V2（批量）
```

社区旧 zip 批量导入：

```bash
node .scripts/import-legacy-zips.mjs "路径/到/主题zip目录"
```

---

## 11. 常见问题

### Q1：装上主题还是默认橙白？

- 确认 `config.spec` 为 `bakamusic-theme@2`  
- 确认客户端版本支持 V2  
- 确认 `index.css` 只有 `:root` token，没有被写坏  

### Q2：深色主题发白 / 发灰？

- `--theme-scheme: dark` 与 `config.scheme: "dark"` 都要写  
- `--theme-bg` 不要只有极低 alpha  
- 文字用浅色（如 `#f5f5f5`），背景用深色实色或较高 alpha  

### Q3：视频很卡 / 包太大？

- 压视频到 5MB 内、包总大小 10MB 内  
- 不要 4K 原片  

### Q4：可以只改字体 / 圆角吗？

- V2 **不允许**主题改布局尺寸与组件结构  
- 圆角、flat/glass 由客户端用户设置控制  

### Q5：preview 可以用纯色吗？

可以：`"preview": "#1a1a1a"`，适合无图极简主题。

---

## 12. 提交前检查清单

- [ ] 文件夹名合法（`[a-zA-Z0-9_-]+`）  
- [ ] `config.json` 含 `"spec": "bakamusic-theme@2"`  
- [ ] `name` / `author` / `version` / `preview` / `description` / `tags` 齐全  
- [ ] `version` 为 `x.y.z`  
- [ ] `tags` 均在 `tags.json` 中；动态主题含「动态」  
- [ ] **没有** `id` 字段  
- [ ] `index.css` 仅 `:root` + 契约 token；含 4 个必填 token  
- [ ] 无客户端 class、无 `--color-*`、无藏滚动条  
- [ ] 图片 ≤ 500KB，视频 ≤ 5MB，整包 ≤ 10MB  
- [ ] `preview` 文件真实存在（或纯色合法）  
- [ ] 若有 iframe：路径正确，资源 `@/` 可解析  
- [ ] `npm run validate -- --themes 你的主题` 通过  
- [ ] 客户端本地安装实机看过 glass + flat  

---

## 13. 参考样例（本仓库）

| 类型 | 目录示例 |
|------|----------|
| 静态深色 | `themes/darkmode/` |
| 动态浅色 | `themes/akie/`、`themes/cute-fluff-ball-critter/` |
| 规范 Schema | [`config.schema.json`](../config.schema.json) |

复制一个最接近你需求的样例文件夹，改 token 与素材，是最快上手方式。

---

## 14. 相关链接

- 客户端：[Toskysun/BakaMusic](https://github.com/Toskysun/BakaMusic)  
- 主题仓库：[Toskysun/BakaThemePacks](https://github.com/Toskysun/BakaThemePacks)  
- 贡献摘要：[CONTRIBUTING.md](../CONTRIBUTING.md)  
- 市场产物分支：`v2/prod`（`publish.json` + `.mftheme`）  

祝创作愉快。做好对比度与体积，就是好主题。
