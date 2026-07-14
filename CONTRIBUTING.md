# 贡献指南 — bakamusic-theme@2

BakaMusic 主题由 **客户端定义契约**，主题包 **只填 token**。  
完整规范见客户端仓库：[`docs/theme-spec-v2.md`](https://github.com/Toskysun/BakaMusic/blob/main/docs/theme-spec-v2.md)（以本地 BakaMusic 仓库文档为准）。

## 分支

| 分支 | 用途 |
|------|------|
| `v2/source` | 源码与 PR 目标 |
| `v2/prod` | CI 产物（勿手改） |

## 快速开始

1. Fork 本仓库，从 `v2/source` 建分支  
2. 在 `themes/` 下新建文件夹（仅 `a-zA-Z0-9_-`）  
3. 编写 `config.json`（**必须** `"spec": "bakamusic-theme@2"`）  
4. 编写 `index.css`：**仅** `:root { --theme-*; }`  
5. 可选：`iframes/app.html` + 媒体资源  
6. 本地：`npm run validate`  
7. 向 `v2/source` 提 PR  

## config.json 必填

```json
{
  "spec": "bakamusic-theme@2",
  "name": "我的主题",
  "author": "你",
  "version": "2.0.0",
  "preview": "@/imgs/preview.jpg",
  "description": "描述",
  "tags": ["暗色"],
  "scheme": "dark"
}
```

含 iframe 时 tags 必须包含 **「动态」**。

## index.css 必填 token

```css
:root {
  --theme-primary: #…;
  --theme-bg: …;
  --theme-text: …;
  --theme-scheme: light; /* 或 dark */
}
```

禁止：客户端 class、MusicFree `--color-*`、隐藏滚动条、改布局尺寸。

## 体积

- 单图 ≤ 500KB  
- 单视频 ≤ 5MB  
- 整包 ≤ 10MB  

## 校验

```bash
npm run validate
npm run validate:theme -- --themes my-theme
```
