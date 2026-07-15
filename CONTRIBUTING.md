# 贡献指南

感谢为 [BakaMusic](https://github.com/Zencok/BakaMusic) 贡献主题。

## 写主题请先读这个

**完整写作教程（推荐）：** [docs/THEME_GUIDE.md](./docs/THEME_GUIDE.md)

创建新主题可直接运行 `$create-baka-theme`，或执行：

```bash
python .agents/skills/create-baka-theme/scripts/create_theme.py \
  --slug <folder> --name "主题名" --author "作者"
```

其中包含：

- 包结构与 `@/` 路径
- `config.json` 全字段
- 全部 `--theme-*` token 说明与示例
- 动态 iframe / 视频压缩
- 本地校验与 `.mftheme` 安装
- PR 上架流程与检查清单

本页只保留 **PR 流程摘要**。

---

## 契约

- 版本：`bakamusic-theme@2`（当前语义修订 2.1）
- 原则：客户端定结构与产品视觉行为；主题用公开 token 绘制可主题化区域 + 可选背景
- Schema：[`config.schema.json`](./config.schema.json)
- Token 清单：[`theme-contract.json`](./theme-contract.json)
- Token 逐项说明：[`docs/THEME_TOKENS.md`](./docs/THEME_TOKENS.md)

---

## 分支

| 分支 | 用途 |
|------|------|
| `v2/source` | 源码，**PR 目标** |
| `v2/prod` | CI 产物，勿手改 |

---

## 提 PR 步骤

1. Fork 本仓库，从 `v2/source` 建分支
2. 在 `themes/<folder>/` 添加主题（文件夹名仅 `a-zA-Z0-9_-`）
3. 确保 `config.json` 含 `"spec": "bakamusic-theme@2"`
4. `index.css` **仅** `:root { --theme-*; }`
5. 本地校验：

   ```bash
   npm ci
   npm run upgrade:semantic -- --themes <folder>
   npm run validate -- --themes <folder>
   ```

6. 向 **`v2/source`** 开 PR，说明主题效果与作者信息
7. 合并后 CI 自动发布到 `v2/prod`

---

## 硬性限制（CI）

| 项 | 限制 |
|----|------|
| 单图 | ≤ 500 KB |
| 单视频 | ≤ 5 MB |
| 整包 | ≤ 10 MB |
| tags | 1～5 个，且 ∈ `tags.json` |
| 动态主题 | 必须带标签「动态」 |
| `id` 字段 | 禁止写入 config（由 meta 管理） |

禁止：客户端 class 选择器、MusicFree / 客户端私有变量、额外 CSS 规则、`!important`、全局藏滚动条和修改布局尺寸。`var()` 只能引用清单内公开 token。

---

## 快速模板

**config.json**

```json
{
  "spec": "bakamusic-theme@2",
  "name": "我的主题",
  "author": "你的名字",
  "version": "2.1.0",
  "preview": "@/imgs/preview.jpg",
  "description": "描述",
  "tags": ["亮色"],
  "scheme": "light"
}
```

**index.css**

```css
:root {
  --theme-primary: #f17d34;
  --theme-bg: #fdfdfd;
  --theme-text: #333333;
  --theme-scheme: light;
}
```

该四项模板满足客户端最小契约；提交官方市场前必须运行 `upgrade:semantic` 补齐语义覆盖层，再通过 `validate`。

更多示例（深色 / 动态视频）见 [THEME_GUIDE.md](./docs/THEME_GUIDE.md)。

---

## 行为准则

- 尊重素材版权，注明来源
- 勿提交过大或无关文件
- 保持 PR 只改自己的主题（除非修仓库工具）
