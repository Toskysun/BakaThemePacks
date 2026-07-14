/**
 * Import legacy BakaMusic theme zips → bakamusic-theme@2 packs
 *
 * Usage:
 *   node .scripts/import-legacy-zips.mjs "D:\Downloads\BakaMusicTheme.zip"
 *   (path may be a folder of zips OR a single .zip)
 */
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { createReadStream } from "fs";
import unzipper from "unzipper";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const THEMES_DIR = path.join(ROOT, "themes");
const WORK = path.join(ROOT, ".temp-import");
const SPEC = "bakamusic-theme@2";
const DEFAULT_AUTHOR = "轻舟折枝";

const SIZE = {
  IMAGE_MAX: 500 * 1024,
  VIDEO_MAX: 5 * 1024 * 1024,
  THEME_TOTAL_MAX: 10 * 1024 * 1024,
};

function extractCssVar(css, name) {
  const re = new RegExp(`--${name}\\s*:\\s*([^;!]+)`, "i");
  const m = css.match(re);
  return m ? m[1].trim().replace(/!important/gi, "").trim() : null;
}

function parseHexOrRgb(value) {
  if (!value) return null;
  const hex = value.match(/#([0-9a-fA-F]{3,8})\b/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length === 8) h = h.slice(0, 6); // drop alpha from #RRGGBBAA
    const n = Number.parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  return null;
}

function toRgb({ r, g, b }) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function toRgba({ r, g, b }, a) {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

function luminance({ r, g, b }) {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function slugify(name) {
  const base = String(name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/【.*?】/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/[^\w\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  if (base && /^[a-z0-9][a-z0-9_-]{1,47}$/i.test(base)) return base.slice(0, 48);
  const hash = crypto.createHash("md5").update(name || Math.random().toString()).digest("hex").slice(0, 10);
  const ascii = base.replace(/[^a-z0-9_-]/gi, "").slice(0, 24);
  return (ascii ? `${ascii}-${hash}` : `theme-${hash}`).slice(0, 48);
}

function uniqueSlug(slug, used) {
  let s = slug;
  let i = 2;
  while (used.has(s) || fsSync.existsSync(path.join(THEMES_DIR, s))) {
    s = `${slug.slice(0, 40)}-${i++}`;
  }
  used.add(s);
  return s;
}

function buildV2Css(tokens) {
  const lines = [
    "/* bakamusic-theme@2 — imported from legacy BakaMusic pack */",
    ":root {",
    `    --theme-primary: ${tokens.primary};`,
    `    --theme-bg: ${tokens.bg};`,
    `    --theme-text: ${tokens.text};`,
    `    --theme-scheme: ${tokens.scheme};`,
  ];
  if (tokens.textSecondary) lines.push(`    --theme-text-secondary: ${tokens.textSecondary};`);
  if (tokens.headerText) lines.push(`    --theme-header-text: ${tokens.headerText};`);
  if (tokens.link) lines.push(`    --theme-link: ${tokens.link};`);
  if (tokens.divider) lines.push(`    --theme-divider: ${tokens.divider};`);
  if (tokens.mask) lines.push(`    --theme-mask: ${tokens.mask};`);
  if (tokens.placeholder) lines.push(`    --theme-placeholder: ${tokens.placeholder};`);
  if (tokens.surfaceAlpha != null) lines.push(`    --theme-surface-alpha: ${tokens.surfaceAlpha};`);
  if (tokens.blur) lines.push(`    --theme-blur: ${tokens.blur};`);
  if (tokens.bgImage) lines.push(`    --theme-bg-image: ${tokens.bgImage};`);
  if (tokens.scrollbar) lines.push(`    --theme-scrollbar-thumb: ${tokens.scrollbar};`);
  lines.push("}", "");
  return lines.join("\n");
}

function tokensFromLegacyCss(css, hasIframe) {
  const primary =
    parseHexOrRgb(extractCssVar(css, "primaryColor")) ||
    (() => {
      const glass = extractCssVar(css, "glassColor");
      if (glass && /^\s*\d+\s*,\s*\d+\s*,\s*\d+/.test(glass)) {
        const [r, g, b] = glass.split(",").map((x) => Number(x.trim()));
        return { r, g, b };
      }
      return null;
    })() ||
    { r: 241, g: 125, b: 52 };

  let glassAlpha = 0.44;
  const alphaRaw = extractCssVar(css, "glassAlpha");
  if (alphaRaw && /^\d+$/.test(alphaRaw)) {
    glassAlpha = Math.min(1, Math.max(0.12, Number(alphaRaw) / 255));
  }

  const text =
    parseHexOrRgb(extractCssVar(css, "textColor")) ||
    parseHexOrRgb(extractCssVar(css, "headerTextColor")) ||
    { r: 17, g: 17, b: 17 };

  const headerText =
    parseHexOrRgb(extractCssVar(css, "headerTextColor")) || text;

  const placeholder =
    parseHexOrRgb(extractCssVar(css, "placeholderColor")) || null;

  const blurRaw = extractCssVar(css, "blurBase");
  const blur = blurRaw && blurRaw.includes("px") ? blurRaw : hasIframe ? "12px" : "10px";

  const scheme = luminance(text) > 0.55 ? "dark" : "light";
  const bgAlpha = hasIframe ? Math.min(glassAlpha, 0.42) : Math.max(glassAlpha, 0.55);

  return {
    primary: toRgb(primary),
    bg: toRgba(primary, bgAlpha),
    text: toRgb(text),
    scheme,
    textSecondary: toRgba(text, 0.68),
    headerText: toRgb(headerText),
    link: toRgb(primary),
    divider: toRgba(text, 0.12),
    mask: scheme === "dark" ? "rgba(0, 0, 0, 0.55)" : toRgba(text, 0.28),
    placeholder: placeholder ? toRgb(placeholder) : toRgba(primary, 0.35),
    surfaceAlpha: bgAlpha,
    blur,
    scrollbar: toRgb(primary),
  };
}

async function findThemeRoot(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const names = new Set(entries.map((e) => e.name));
  if (names.has("config.json") && names.has("index.css")) return dir;
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith("__") || e.name.startsWith(".")) continue;
    const nested = await findThemeRoot(path.join(dir, e.name));
    if (nested) return nested;
  }
  return null;
}

async function extractZip(zipPath, dest) {
  await fs.mkdir(dest, { recursive: true });
  const directory = await unzipper.Open.file(zipPath);
  for (const entry of directory.files) {
    const name = entry.path.replaceAll("\\", "/");
    if (!name || name.startsWith("__MACOSX")) continue;
    const target = path.resolve(dest, name);
    if (!target.startsWith(path.resolve(dest))) continue;
    if (entry.type === "Directory") {
      await fs.mkdir(target, { recursive: true });
      continue;
    }
    await fs.mkdir(path.dirname(target), { recursive: true });
    await pipeline(entry.stream(), createWriteStream(target));
  }
}

async function whichFfmpeg() {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    return "ffmpeg";
  } catch {
    return null;
  }
}

async function compressImage(src, dest) {
  const ffmpeg = await whichFfmpeg();
  if (!ffmpeg) {
    await fs.copyFile(src, dest);
    return;
  }
  await execFileAsync(ffmpeg, [
    "-y", "-i", src,
    "-vf", "scale='min(1280,iw)':-2",
    "-q:v", "6",
    dest,
  ], { windowsHide: true });
  const st = await fs.stat(dest);
  if (st.size > SIZE.IMAGE_MAX) {
    await execFileAsync(ffmpeg, [
      "-y", "-i", src,
      "-vf", "scale='min(960,iw)':-2",
      "-q:v", "8",
      dest,
    ], { windowsHide: true });
  }
}

async function compressVideo(src, dest) {
  const ffmpeg = await whichFfmpeg();
  if (!ffmpeg) {
    await fs.copyFile(src, dest);
    return;
  }
  // Progressive quality until under limit
  for (const [scale, crf] of [
    ["min(854,iw)", "32"],
    ["min(640,iw)", "34"],
    ["min(480,iw)", "36"],
    ["min(360,iw)", "38"],
  ]) {
    await execFileAsync(ffmpeg, [
      "-y", "-i", src,
      "-vf", `scale='${scale}':-2`,
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", crf,
      "-an",
      "-movflags", "+faststart",
      "-t", "30", // cap duration for huge loops
      dest,
    ], { windowsHide: true, maxBuffer: 20 * 1024 * 1024 });
    const st = await fs.stat(dest);
    if (st.size <= SIZE.VIDEO_MAX) return;
  }
}

async function processMedia(themeRoot, outRoot, config) {
  const imgsIn = path.join(themeRoot, "imgs");
  const imgsOut = path.join(outRoot, "imgs");
  await fs.mkdir(imgsOut, { recursive: true });

  let previewRel = config.preview || "";
  const mediaMap = new Map(); // old relative path -> new

  if (fsSync.existsSync(imgsIn)) {
    const files = await fs.readdir(imgsIn);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const src = path.join(imgsIn, file);
      const st = await fs.stat(src);
      if (!st.isFile()) continue;

      if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
        const isPreview = previewRel.includes(file) || file.toLowerCase().includes("preview");
        const destName = isPreview ? "preview.jpg" : `img-${crypto.createHash("md5").update(file).digest("hex").slice(0, 8)}.jpg`;
        const dest = path.join(imgsOut, destName);
        try {
          await compressImage(src, dest);
        } catch {
          await fs.copyFile(src, dest);
        }
        mediaMap.set(file, destName);
        if (isPreview || previewRel.includes(file)) {
          previewRel = `@/imgs/${destName}`;
        }
      } else if ([".mp4", ".webm"].includes(ext)) {
        const destName = "bg.mp4";
        const dest = path.join(imgsOut, destName);
        try {
          await compressVideo(src, dest);
        } catch (e) {
          console.warn(`    video compress fail ${file}: ${e.message}`);
          // skip huge video if compress fails
          continue;
        }
        const vst = await fs.stat(dest).catch(() => null);
        if (!vst || vst.size > SIZE.VIDEO_MAX * 1.05) {
          console.warn(`    video still too large, dropping ${file}`);
          await fs.unlink(dest).catch(() => undefined);
          continue;
        }
        mediaMap.set(file, destName);
      }
    }
  }

  // iframe
  let iframe = null;
  const iframeApp = config.iframe?.app;
  if (iframeApp) {
    const iframeSrc = path.join(themeRoot, iframeApp.replace("@/", ""));
    if (fsSync.existsSync(iframeSrc)) {
      let html = await fs.readFile(iframeSrc, "utf-8");
      // rewrite media references to compressed names
      for (const [oldName, newName] of mediaMap) {
        html = html.split(oldName).join(newName);
      }
      // prefer bg.mp4 if present
      if (fsSync.existsSync(path.join(imgsOut, "bg.mp4"))) {
        html = html.replace(/@\/imgs\/[^"']+\.mp4/gi, "@/imgs/bg.mp4");
      }
      const iframeOut = path.join(outRoot, "iframes");
      await fs.mkdir(iframeOut, { recursive: true });
      await fs.writeFile(path.join(iframeOut, "app.html"), html, "utf-8");
      iframe = { app: "@/iframes/app.html" };
    }
  }

  if (!previewRel || previewRel.startsWith("@/")) {
    if (fsSync.existsSync(path.join(imgsOut, "preview.jpg"))) {
      previewRel = "@/imgs/preview.jpg";
    } else {
      // any image
      const imgs = fsSync.existsSync(imgsOut) ? await fs.readdir(imgsOut) : [];
      const img = imgs.find((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
      if (img) previewRel = `@/imgs/${img}`;
      else previewRel = "#f17d34";
    }
  }

  return { previewRel, iframe, hasVideo: fsSync.existsSync(path.join(imgsOut, "bg.mp4")) };
}

async function dirSize(dir) {
  let total = 0;
  async function walk(d) {
    for (const e of await fs.readdir(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else total += (await fs.stat(p)).size;
    }
  }
  await walk(dir);
  return total;
}

async function importOneZip(zipPath, usedSlugs) {
  const zipName = path.basename(zipPath, path.extname(zipPath));
  console.log(`\n📦 ${zipName}`);

  const extractDir = path.join(WORK, "extract", crypto.randomBytes(6).toString("hex"));
  await extractZip(zipPath, extractDir);
  const themeRoot = await findThemeRoot(extractDir);
  if (!themeRoot) {
    console.warn("  ✗ no config.json/index.css");
    return null;
  }

  const config = JSON.parse(await fs.readFile(path.join(themeRoot, "config.json"), "utf-8"));
  const css = await fs.readFile(path.join(themeRoot, "index.css"), "utf-8");
  const slug = uniqueSlug(slugify(config.name || zipName), usedSlugs);
  const outRoot = path.join(THEMES_DIR, slug);
  await fs.rm(outRoot, { recursive: true, force: true });
  await fs.mkdir(outRoot, { recursive: true });

  const hasIframe = Boolean(config.iframe?.app);
  const { previewRel, iframe, hasVideo } = await processMedia(themeRoot, outRoot, config);
  const tokens = tokensFromLegacyCss(css, hasIframe || hasVideo);
  await fs.writeFile(path.join(outRoot, "index.css"), buildV2Css(tokens), "utf-8");

  const author = (config.author && String(config.author).trim()) || DEFAULT_AUTHOR;
  const nextConfig = {
    spec: SPEC,
    name: config.name || zipName,
    author,
    version: "2.0.0",
    preview: previewRel,
    description: config.description || config.name || zipName,
    tags: iframe || hasVideo ? ["动态"] : ["插画"],
    scheme: tokens.scheme,
  };
  if (iframe) nextConfig.iframe = iframe;
  // ensure dynamic tag if iframe
  if (iframe && !nextConfig.tags.includes("动态")) nextConfig.tags.push("动态");

  // tags must be from tags.json — map loosely
  const tagsData = JSON.parse(await fs.readFile(path.join(ROOT, "tags.json"), "utf-8"));
  const valid = new Set(tagsData.tags.map((t) => t.label));
  nextConfig.tags = nextConfig.tags.filter((t) => valid.has(t));
  if (!nextConfig.tags.length) nextConfig.tags = [tokens.scheme === "dark" ? "暗色" : "亮色"];
  if (iframe && valid.has("动态") && !nextConfig.tags.includes("动态")) {
    nextConfig.tags = ["动态", ...nextConfig.tags].slice(0, 5);
  }

  await fs.writeFile(path.join(outRoot, "config.json"), `${JSON.stringify(nextConfig, null, 4)}\n`, "utf-8");

  const total = await dirSize(outRoot);
  console.log(`  → themes/${slug} (${(total / 1024 / 1024).toFixed(2)} MB) author=${author}`);
  if (total > SIZE.THEME_TOTAL_MAX) {
    console.warn(`  ⚠ over ${SIZE.THEME_TOTAL_MAX} bytes — may fail validate`);
  }
  return { slug, author, name: nextConfig.name };
}

async function main() {
  const input = process.argv[2] || "D:\\Downloads\\BakaMusicTheme.zip";
  if (!fsSync.existsSync(input)) {
    console.error("Input not found:", input);
    process.exit(1);
  }

  await fs.rm(WORK, { recursive: true, force: true });
  await fs.mkdir(WORK, { recursive: true });

  let zips = [];
  const st = await fs.stat(input);
  if (st.isDirectory()) {
    zips = (await fs.readdir(input))
      .filter((f) => f.toLowerCase().endsWith(".zip"))
      .map((f) => path.join(input, f));
  } else if (input.toLowerCase().endsWith(".zip")) {
    zips = [input];
  } else {
    console.error("Expected a folder of zips or a .zip file");
    process.exit(1);
  }

  console.log(`Found ${zips.length} zip(s)`);
  const used = new Set();
  const results = [];
  for (const z of zips) {
    try {
      const r = await importOneZip(z, used);
      if (r) results.push(r);
    } catch (e) {
      console.error(`  ✗ ${path.basename(z)}: ${e.message}`);
    }
  }

  // meta.json entries
  const metaPath = path.join(ROOT, "meta.json");
  const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
  for (const r of results) {
    if (!meta[r.slug]) {
      meta[r.slug] = {
        id: crypto.randomBytes(12).toString("base64url").slice(0, 21),
        createdAt: new Date().toISOString(),
      };
    }
  }
  await fs.writeFile(metaPath, `${JSON.stringify(meta, null, 4)}\n`, "utf-8");

  console.log(`\nImported ${results.length} themes.`);
  await fs.rm(WORK, { recursive: true, force: true }).catch(() => undefined);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
