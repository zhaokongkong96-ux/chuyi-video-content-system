#!/usr/bin/env node

/**
 * 半自动图文内容包生成脚本
 *
 * 用途：
 * 1. 读取 input 目录下的大纲 Markdown / JSON
 * 2. 自动生成一套图文页脚本
 * 3. 生成每页 SVG 图片
 * 4. 生成小红书文案
 * 5. 生成抖音图文文案
 * 6. 生成手动发布清单
 * 7. 生成数据回填模板
 *
 * 不做：
 * - 不绑定小红书 / 抖音账号
 * - 不调用 OAuth
 * - 不调用平台发布 API
 * - 不依赖 Vercel
 *
 * 推荐执行：
 * node scripts/generate_graphic_content_package.js input/daily_outline.md
 *
 * 如果不传参数，会默认读取：
 * input/graphic_outline.md
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const DEFAULT_INPUT = path.join(ROOT_DIR, "input", "graphic_outline.md");
const OUTPUT_ROOT = path.join(ROOT_DIR, "output");

const PAGE_WIDTH = 1086;
const PAGE_HEIGHT = 1448;

const DEFAULT_THEME = {
  name: "蓝色严谨专业风",
  primary: "#0B1F4D",
  primary2: "#1155E8",
  primary3: "#2F7DFF",
  lightBlue: "#EAF3FF",
  paleBlue: "#F5F9FF",
  border: "#BFD5FF",
  text: "#111827",
  muted: "#64748B",
  white: "#FFFFFF",
  orange: "#FF6A3D",
  orangeLight: "#FFF0E8",
  bg1: "#F8FBFF",
  bg2: "#EAF3FF"
};

const DEFAULT_HASHTAGS = [
  "产品经理",
  "用户体验",
  "用户研究",
  "设计策略",
  "运营干货",
  "职场技能",
  "互联网干货",
  "初一设计策略"
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, data) {
  writeText(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function nowISOString() {
  return new Date().toISOString();
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripMarkdown(value) {
  return String(value ?? "")
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

function slugify(value) {
  const raw = String(value ?? "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (raw) return raw.slice(0, 80);
  return crypto.randomBytes(4).toString("hex");
}

function normalizeBullet(line) {
  return line
    .replace(/^\s*[-*+]\s+/, "")
    .replace(/^\s*\d+[.)、]\s+/, "")
    .trim();
}

function splitIntoLines(text, maxChars = 18) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const chunks = [];
  let current = "";

  for (const char of clean) {
    const currentLength = [...current].length;
    if (currentLength >= maxChars && /[，。；、：,.!?！？\s]/.test(char)) {
      chunks.push(current.trim());
      current = "";
    } else if (currentLength >= maxChars + 4) {
      chunks.push(current.trim());
      current = "";
    }
    current += char;
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function parseFrontMatter(md) {
  const result = {};
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: result, body: md };

  const raw = match[1];
  for (const line of raw.split("\n")) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) continue;
    result[key.trim()] = rest.join(":").trim();
  }

  return {
    meta: result,
    body: md.slice(match[0].length).trim()
  };
}

function parseMarkdownOutline(md) {
  const { meta, body } = parseFrontMatter(md);
  const lines = body.split(/\r?\n/);

  let title = meta.title || "";
  let subtitle = meta.subtitle || "";
  let topic = meta.topic || "";
  let audience = meta.audience || "";
  let style = meta.style || DEFAULT_THEME.name;

  const pages = [];
  let currentPage = null;
  const globalBullets = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!title && trimmed.startsWith("# ")) {
      title = stripMarkdown(trimmed.replace(/^#\s+/, ""));
      continue;
    }

    if (trimmed.startsWith("## ")) {
      if (currentPage) pages.push(currentPage);
      currentPage = {
        title: stripMarkdown(trimmed.replace(/^##\s+/, "")),
        bullets: [],
        raw: []
      };
      continue;
    }

    if (/^(副标题|subtitle)[:：]/i.test(trimmed)) {
      subtitle = trimmed.replace(/^(副标题|subtitle)[:：]/i, "").trim();
      continue;
    }

    if (/^(主题|topic)[:：]/i.test(trimmed)) {
      topic = trimmed.replace(/^(主题|topic)[:：]/i, "").trim();
      continue;
    }

    if (/^(目标读者|audience)[:：]/i.test(trimmed)) {
      audience = trimmed.replace(/^(目标读者|audience)[:：]/i, "").trim();
      continue;
    }

    if (currentPage) {
      currentPage.raw.push(trimmed);
      if (/^\s*[-*+]|\d+[.)、]/.test(trimmed)) {
        currentPage.bullets.push(normalizeBullet(trimmed));
      } else {
        currentPage.bullets.push(stripMarkdown(trimmed));
      }
    } else {
      if (/^\s*[-*+]|\d+[.)、]/.test(trimmed)) {
        globalBullets.push(normalizeBullet(trimmed));
      } else if (!subtitle && trimmed.length <= 40 && !trimmed.startsWith("#")) {
        subtitle = stripMarkdown(trimmed);
      } else {
        globalBullets.push(stripMarkdown(trimmed));
      }
    }
  }

  if (currentPage) pages.push(currentPage);

  if (!title) title = topic || "每日图文内容";
  if (!topic) topic = title;
  if (!subtitle) subtitle = "设计·策略·产品｜方法论图文";

  return {
    topic,
    title,
    subtitle,
    audience,
    style,
    globalBullets: globalBullets.filter(Boolean),
    pages: pages.filter((page) => page.title || page.bullets.length > 0)
  };
}

function parseJsonOutline(jsonText) {
  const data = JSON.parse(jsonText);
  return {
    topic: data.topic || data.title || "每日图文内容",
    title: data.title || data.topic || "每日图文内容",
    subtitle: data.subtitle || "设计·策略·产品｜方法论图文",
    audience: data.audience || "",
    style: data.style || DEFAULT_THEME.name,
    globalBullets: data.bullets || data.key_points || [],
    pages: Array.isArray(data.pages)
      ? data.pages.map((page) => ({
          title: page.title || page.page_title || "",
          bullets: page.bullets || page.content || page.points || [],
          raw: []
        }))
      : []
  };
}

function loadOutline(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`找不到输入大纲：${inputPath}`);
  }

  const content = readText(inputPath);
  if (inputPath.endsWith(".json")) {
    return parseJsonOutline(content);
  }

  return parseMarkdownOutline(content);
}

function chooseLayout(page) {
  const title = page.title || "";
  const count = page.bullets.length;

  if (/公式|评分|RICE|ICE|计算/.test(title)) return "公式重点页";
  if (/步骤|流程|路径|怎么做/.test(title)) return "流程步骤页";
  if (/分类|类型|维度/.test(title)) return "分类卡片页";
  if (count >= 5) return "清单卡片页";
  return "重点解释页";
}

function buildPages(outline) {
  const pages = [];

  pages.push({
    page_number: 1,
    page_type: "cover",
    page_title: outline.title,
    page_goal: "用强封面建立主题认知和收藏理由",
    layout_type: "深灰蓝封面 + 方法论装饰图形",
    exact_text: {
      title: outline.title,
      subtitle: outline.subtitle,
      footer: "初一｜设计·策略·产品"
    },
    bullets: []
  });

  const sourcePages = outline.pages.length > 0 ? outline.pages : [];

  if (sourcePages.length > 0) {
    for (const sourcePage of sourcePages) {
      pages.push({
        page_number: pages.length + 1,
        page_type: "content",
        page_title: sourcePage.title,
        page_goal: "拆解一个核心知识点",
        layout_type: chooseLayout(sourcePage),
        exact_text: {
          title: sourcePage.title,
          bullets: sourcePage.bullets.slice(0, 6)
        },
        bullets: sourcePage.bullets.slice(0, 6)
      });
    }
  } else {
    const bullets = outline.globalBullets.length
      ? outline.globalBullets
      : [
          "先明确主题要解决什么问题",
          "再拆解核心概念和判断标准",
          "最后输出可执行步骤和模板"
        ];

    pages.push({
      page_number: pages.length + 1,
      page_type: "content",
      page_title: "为什么这个方法值得掌握？",
      page_goal: "说明主题价值",
      layout_type: "问题引入页",
      exact_text: {
        title: "为什么这个方法值得掌握？",
        bullets: bullets.slice(0, 4)
      },
      bullets: bullets.slice(0, 4)
    });

    pages.push({
      page_number: pages.length + 1,
      page_type: "content",
      page_title: "核心框架怎么理解？",
      page_goal: "建立方法论框架",
      layout_type: "框架拆解页",
      exact_text: {
        title: "核心框架怎么理解？",
        bullets: [
          "先定义问题：明确要解决的决策场景",
          "再拆解维度：找到影响判断的关键变量",
          "最后形成动作：把洞察转成执行方案"
        ]
      },
      bullets: [
        "先定义问题：明确要解决的决策场景",
        "再拆解维度：找到影响判断的关键变量",
        "最后形成动作：把洞察转成执行方案"
      ]
    });

    pages.push({
      page_number: pages.length + 1,
      page_type: "content",
      page_title: "直接照着做的步骤",
      page_goal: "给用户可执行路径",
      layout_type: "步骤流程页",
      exact_text: {
        title: "直接照着做的步骤",
        bullets: [
          "1. 写清楚目标",
          "2. 找到目标用户或场景",
          "3. 收集证据和反馈",
          "4. 拆解判断维度",
          "5. 输出结论和行动项"
        ]
      },
      bullets: [
        "1. 写清楚目标",
        "2. 找到目标用户或场景",
        "3. 收集证据和反馈",
        "4. 拆解判断维度",
        "5. 输出结论和行动项"
      ]
    });
  }

  pages.push({
    page_number: pages.length + 1,
    page_type: "summary",
    page_title: "最后帮你快速记住重点",
    page_goal: "总结核心观点并引导互动",
    layout_type: "总结 + CTA 互动页",
    exact_text: {
      title: "最后帮你快速记住重点",
      bullets: [
        "先判断问题，不要直接做方案",
        "用框架拆解，避免只凭感觉决策",
        "把结论转成行动，才是真正有价值"
      ],
      cta: "你还想看哪个方法论？评论区聊聊～"
    },
    bullets: [
      "先判断问题，不要直接做方案",
      "用框架拆解，避免只凭感觉决策",
      "把结论转成行动，才是真正有价值"
    ]
  });

  return pages.map((page, index) => ({
    ...page,
    page_number: index + 1
  }));
}

function makeImagePrompt(outline, page, totalPages) {
  const text = Array.isArray(page.bullets) ? page.bullets.join("；") : "";

  return [
    `生成一张 3:4 竖版小红书图文页面，第 ${page.page_number}/${totalPages} 页。`,
    `主题：${outline.title}`,
    `页面标题：${page.page_title}`,
    `页面目标：${page.page_goal}`,
    `视觉风格：高级商务信息图、克制科技蓝视觉系统、咨询公司报告式排版、冷静理性、结构化、强标题层级、大留白、精准网格系统。`,
    `配色：深海军蓝主标题，科技蓝重点词，浅蓝灰卡片，白色留白，少量橙色只用于互动或提醒。`,
    `排版：${page.layout_type}，严格网格对齐，圆角卡片统一，图标统一为蓝色线性风格，页面只保留一个视觉中心。`,
    `正文内容：${text}`,
    `品牌元素：底部居中放“初一设计策略”，右下角放页码 ${page.page_number}/${totalPages}。`,
    `避免：卡通风、杂色、拥挤、文字过小、普通 PPT 感、图标风格混乱。`
  ].join("\n");
}

function svgTextBlock(lines, x, y, options = {}) {
  const {
    size = 34,
    weight = 500,
    fill = DEFAULT_THEME.text,
    lineHeight = Math.round(size * 1.45),
    maxLines = 8
  } = options;

  return lines
    .slice(0, maxLines)
    .map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<text x="${x}" y="${y + dy}" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="Arial, 'Microsoft YaHei', sans-serif">${escapeXml(line)}</text>`;
    })
    .join("\n");
}

function svgCard(x, y, w, h, options = {}) {
  const {
    fill = DEFAULT_THEME.white,
    stroke = DEFAULT_THEME.border,
    radius = 28,
    opacity = 1
  } = options;

  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="${opacity}" />`;
}

function renderCoverSvg(outline, page, totalPages) {
  const titleLines = splitIntoLines(page.page_title, 12);
  const subtitleLines = splitIntoLines(outline.subtitle, 22);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071735"/>
      <stop offset="58%" stop-color="#0B1F4D"/>
      <stop offset="100%" stop-color="#1155E8"/>
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="70%" r="60%">
      <stop offset="0%" stop-color="#2F7DFF" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#2F7DFF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="url(#bg)"/>
  <circle cx="820" cy="930" r="480" fill="url(#glow)"/>

  <g opacity="0.18">
    ${Array.from({ length: 12 })
      .map((_, row) =>
        Array.from({ length: 9 })
          .map((__, col) => `<circle cx="${70 + col * 34}" cy="${80 + row * 34}" r="8" fill="#FFFFFF"/>`)
          .join("\n")
      )
      .join("\n")}
  </g>

  <g transform="translate(92 186)">
    ${svgTextBlock(titleLines, 0, 0, {
      size: 92,
      weight: 800,
      fill: DEFAULT_THEME.white,
      lineHeight: 118,
      maxLines: 3
    })}
  </g>

  <g transform="translate(92 505)">
    <rect x="0" y="0" width="760" height="82" rx="41" fill="#1769FF"/>
    ${svgTextBlock(subtitleLines, 46, 54, {
      size: 34,
      weight: 700,
      fill: DEFAULT_THEME.white,
      lineHeight: 44,
      maxLines: 1
    })}
  </g>

  <g transform="translate(205 685)">
    <line x1="0" y1="240" x2="676" y2="240" stroke="#DDEBFF" stroke-width="4" opacity="0.85"/>
    <line x1="338" y1="0" x2="338" y2="480" stroke="#DDEBFF" stroke-width="4" opacity="0.85"/>
    <circle cx="338" cy="240" r="80" fill="#1769FF" stroke="#DDEBFF" stroke-width="5"/>
    <text x="338" y="254" text-anchor="middle" font-size="36" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">METHOD</text>

    ${svgCard(0, 0, 292, 190, { fill: "#123A83", stroke: "#3C82FF", opacity: 0.92 })}
    ${svgCard(384, 0, 292, 190, { fill: "#1769FF", stroke: "#69A4FF", opacity: 0.92 })}
    ${svgCard(0, 290, 292, 190, { fill: "#1B315F", stroke: "#6D89B8", opacity: 0.92 })}
    ${svgCard(384, 290, 292, 190, { fill: "#38577F", stroke: "#AFC7EA", opacity: 0.82 })}

    <text x="146" y="104" text-anchor="middle" font-size="34" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">分类</text>
    <text x="530" y="104" text-anchor="middle" font-size="34" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">判断</text>
    <text x="146" y="394" text-anchor="middle" font-size="34" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">排序</text>
    <text x="530" y="394" text-anchor="middle" font-size="34" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">落地</text>
  </g>

  <g transform="translate(92 1235)" opacity="0.9">
    <text x="0" y="0" font-size="30" font-weight="700" fill="#BFD5FF" font-family="Arial, 'Microsoft YaHei', sans-serif">科学分类</text>
    <text x="230" y="0" font-size="30" font-weight="700" fill="#BFD5FF" font-family="Arial, 'Microsoft YaHei', sans-serif">优先排序</text>
    <text x="460" y="0" font-size="30" font-weight="700" fill="#BFD5FF" font-family="Arial, 'Microsoft YaHei', sans-serif">提升效率</text>
    <text x="690" y="0" font-size="30" font-weight="700" fill="#BFD5FF" font-family="Arial, 'Microsoft YaHei', sans-serif">驱动增长</text>
  </g>

  <text x="92" y="1350" font-size="34" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">初一</text>
  <text x="92" y="1390" font-size="22" font-weight="500" fill="#BFD5FF" font-family="Arial, 'Microsoft YaHei', sans-serif">设计 · 策略 · 产品</text>

  <rect x="910" y="1332" width="112" height="54" rx="27" fill="#1769FF"/>
  <text x="966" y="1368" text-anchor="middle" font-size="26" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">${page.page_number}/${totalPages}</text>
</svg>`;
}

function renderContentSvg(outline, page, totalPages) {
  const titleLines = splitIntoLines(page.page_title, 13);
  const bullets = page.bullets && page.bullets.length ? page.bullets : ["补充核心内容", "提炼关键判断", "输出行动建议"];

  const maxCards = Math.min(bullets.length, 6);
  const cardStartY = 385;
  const cardHeight = maxCards >= 5 ? 130 : 160;
  const cardGap = maxCards >= 5 ? 28 : 34;

  const cards = bullets.slice(0, maxCards).map((bullet, index) => {
    const y = cardStartY + index * (cardHeight + cardGap);
    const bulletLines = splitIntoLines(bullet, 25);
    const number = String(index + 1).padStart(2, "0");

    return `
      ${svgCard(76, y, 934, cardHeight, { fill: DEFAULT_THEME.white, stroke: DEFAULT_THEME.border, radius: 26 })}
      <circle cx="142" cy="${y + cardHeight / 2}" r="42" fill="#1769FF"/>
      <text x="142" y="${y + cardHeight / 2 + 10}" text-anchor="middle" font-size="28" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">${number}</text>
      ${svgTextBlock(bulletLines, 220, y + 55, {
        size: 31,
        weight: 650,
        fill: DEFAULT_THEME.text,
        lineHeight: 42,
        maxLines: 2
      })}
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pageBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${DEFAULT_THEME.bg1}"/>
      <stop offset="100%" stop-color="${DEFAULT_THEME.bg2}"/>
    </linearGradient>
  </defs>

  <rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="url(#pageBg)"/>

  <g opacity="0.26">
    ${Array.from({ length: 10 })
      .map((_, row) =>
        Array.from({ length: 10 })
          .map((__, col) => `<circle cx="${50 + col * 28}" cy="${70 + row * 28}" r="7" fill="#9EC5FF"/>`)
          .join("\n")
      )
      .join("\n")}
  </g>

  <path d="M870 112 C920 160, 870 210, 936 258 C982 292, 1000 340, 950 386" fill="none" stroke="#7FB2FF" stroke-width="4" stroke-dasharray="12 12" opacity="0.7"/>
  <circle cx="880" cy="112" r="28" fill="#1769FF" opacity="0.9"/>
  <rect x="940" y="360" width="20" height="74" rx="8" fill="#1769FF"/>
  <path d="M960 365 L1014 384 L960 402 Z" fill="#1769FF"/>

  <g transform="translate(76 110)">
    <rect x="0" y="0" width="30" height="30" transform="rotate(45 15 15)" fill="#1769FF"/>
    ${svgTextBlock(titleLines, 55, 38, {
      size: 70,
      weight: 850,
      fill: DEFAULT_THEME.primary,
      lineHeight: 88,
      maxLines: 2
    })}
  </g>

  <g transform="translate(76 305)">
    <rect x="0" y="0" width="320" height="56" rx="28" fill="#1769FF"/>
    <text x="32" y="37" font-size="28" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">${escapeXml(page.layout_type)}</text>
  </g>

  <g>
    ${cards.join("\n")}
  </g>

  <line x1="100" y1="1348" x2="430" y2="1348" stroke="#2F7DFF" stroke-width="3" opacity="0.65"/>
  <circle cx="450" cy="1348" r="6" fill="#2F7DFF"/>
  <text x="543" y="1360" text-anchor="middle" font-size="30" font-weight="800" fill="${DEFAULT_THEME.primary}" font-family="Arial, 'Microsoft YaHei', sans-serif">初一设计策略</text>
  <circle cx="636" cy="1348" r="6" fill="#2F7DFF"/>
  <line x1="656" y1="1348" x2="890" y2="1348" stroke="#2F7DFF" stroke-width="3" opacity="0.65"/>
  <rect x="910" y="1322" width="112" height="54" rx="27" fill="#1769FF"/>
  <text x="966" y="1358" text-anchor="middle" font-size="26" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">${page.page_number}/${totalPages}</text>
</svg>`;
}

function renderSummarySvg(outline, page, totalPages) {
  const titleLines = splitIntoLines(page.page_title, 13);
  const bullets = page.bullets.slice(0, 3);

  const rows = bullets.map((bullet, index) => {
    const y = 470 + index * 160;
    const lines = splitIntoLines(bullet, 22);

    return `
      ${svgCard(76, y, 934, 124, { fill: DEFAULT_THEME.white, stroke: DEFAULT_THEME.border, radius: 26 })}
      <circle cx="145" cy="${y + 62}" r="42" fill="#1769FF"/>
      <text x="145" y="${y + 72}" text-anchor="middle" font-size="28" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">${String(index + 1).padStart(2, "0")}</text>
      ${svgTextBlock(lines, 220, y + 54, {
        size: 32,
        weight: 700,
        fill: DEFAULT_THEME.text,
        lineHeight: 42,
        maxLines: 2
      })}
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pageBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${DEFAULT_THEME.bg1}"/>
      <stop offset="100%" stop-color="${DEFAULT_THEME.bg2}"/>
    </linearGradient>
  </defs>

  <rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="url(#pageBg)"/>

  <g opacity="0.26">
    ${Array.from({ length: 10 })
      .map((_, row) =>
        Array.from({ length: 10 })
          .map((__, col) => `<circle cx="${50 + col * 28}" cy="${70 + row * 28}" r="7" fill="#9EC5FF"/>`)
          .join("\n")
      )
      .join("\n")}
  </g>

  <g transform="translate(76 130)">
    ${svgTextBlock(titleLines, 0, 0, {
      size: 78,
      weight: 850,
      fill: DEFAULT_THEME.primary,
      lineHeight: 96,
      maxLines: 2
    })}
  </g>

  <g transform="translate(76 355)">
    <rect x="0" y="0" width="330" height="58" rx="29" fill="#1769FF"/>
    <text x="34" y="38" font-size="28" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">📌 核心要点总结</text>
  </g>

  ${rows.join("\n")}

  <g transform="translate(76 1000)">
    <rect x="0" y="0" width="934" height="230" rx="34" fill="${DEFAULT_THEME.orangeLight}" stroke="#FFB197" stroke-width="2"/>
    <circle cx="90" cy="112" r="58" fill="${DEFAULT_THEME.orange}"/>
    <text x="90" y="124" text-anchor="middle" font-size="44" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">···</text>
    <text x="190" y="88" font-size="34" font-weight="800" fill="${DEFAULT_THEME.text}" font-family="Arial, 'Microsoft YaHei', sans-serif">你还想看哪个方法论？</text>
    <rect x="190" y="118" width="330" height="66" rx="33" fill="${DEFAULT_THEME.orange}"/>
    <text x="355" y="162" text-anchor="middle" font-size="32" font-weight="850" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">评论区聊聊～</text>
    <text x="190" y="215" font-size="28" font-weight="650" fill="${DEFAULT_THEME.text}" font-family="Arial, 'Microsoft YaHei', sans-serif">需要完整模板可以扣 1 👇</text>
  </g>

  <g transform="translate(76 1270)">
    ${DEFAULT_HASHTAGS.slice(0, 5)
      .map((tag, index) => {
        const x = index * 190;
        return `<rect x="${x}" y="0" width="160" height="46" rx="23" fill="#E5F0FF"/><text x="${x + 80}" y="31" text-anchor="middle" font-size="22" font-weight="700" fill="${DEFAULT_THEME.primary}" font-family="Arial, 'Microsoft YaHei', sans-serif">#${escapeXml(tag)}</text>`;
      })
      .join("\n")}
  </g>

  <text x="543" y="1370" text-anchor="middle" font-size="30" font-weight="800" fill="${DEFAULT_THEME.primary}" font-family="Arial, 'Microsoft YaHei', sans-serif">初一设计策略</text>
  <rect x="910" y="1322" width="112" height="54" rx="27" fill="#1769FF"/>
  <text x="966" y="1358" text-anchor="middle" font-size="26" font-weight="800" fill="#FFFFFF" font-family="Arial, 'Microsoft YaHei', sans-serif">${page.page_number}/${totalPages}</text>
</svg>`;
}

function renderSvg(outline, page, totalPages) {
  if (page.page_type === "cover") return renderCoverSvg(outline, page, totalPages);
  if (page.page_type === "summary") return renderSummarySvg(outline, page, totalPages);
  return renderContentSvg(outline, page, totalPages);
}

function buildXiaohongshuCaption(outline, pages) {
  const keyPages = pages
    .filter((page) => page.page_type !== "cover" && page.page_type !== "summary")
    .slice(0, 6);

  const body = [
    `# ${outline.title}`,
    "",
    "做产品、运营、用户体验、设计策略时，最怕的不是没有方法，而是：",
    "",
    "看了很多内容，但真正要用的时候，还是不知道从哪里下手。",
    "",
    `这篇把「${outline.title}」拆成了一套可以直接照着用的图文框架。`,
    "",
    "你可以重点看这几部分：",
    "",
    ...keyPages.flatMap((page, index) => [
      `**${String(index + 1).padStart(2, "0")}｜${page.page_title}**`,
      ...page.bullets.slice(0, 2).map((bullet) => `- ${bullet}`),
      ""
    ]),
    "最后记住一句话：",
    "",
    "方法论不是为了显得专业，而是为了让判断更清楚、行动更可执行。",
    "",
    "你还想看哪个方法论？",
    "评论区聊聊～",
    "需要完整模板可以扣 **1** 👇",
    "",
    DEFAULT_HASHTAGS.map((tag) => `#${tag}`).join(" ")
  ];

  return body.join("\n");
}

function buildDouyinCaption(outline, pages) {
  const title = outline.title;
  const highlights = pages
    .filter((page) => page.page_type !== "cover")
    .slice(0, 4)
    .map((page) => `- ${page.page_title}`);

  return [
    `${title}`,
    "",
    "别再凭感觉做判断了。",
    "这套图文把核心方法、步骤和应用场景拆清楚，照着做就能用。",
    "",
    "建议按顺序看：",
    ...highlights,
    "",
    "适合产品、运营、设计、UX、用户研究收藏备用。",
    "",
    "你还想看哪个方法？评论区告诉我。",
    "",
    "#产品经理 #用户体验 #用户研究 #运营干货 #职场技能 #初一设计策略"
  ].join("\n");
}

function buildManualPublishGuide(outline, outputDir, pages) {
  return [
    `# 手动发布清单｜${outline.title}`,
    "",
    "## 01 图片上传顺序",
    "",
    ...pages.map((page) => `- 第 ${page.page_number} 页：images/page_${String(page.page_number).padStart(2, "0")}.svg`),
    "",
    "## 02 小红书发布",
    "",
    "### 标题建议",
    "",
    outline.title,
    "",
    "### 正文复制",
    "",
    "请复制 `xiaohongshu_caption.md` 内容。",
    "",
    "### 标签",
    "",
    DEFAULT_HASHTAGS.map((tag) => `#${tag}`).join(" "),
    "",
    "## 03 抖音图文发布",
    "",
    "### 标题建议",
    "",
    outline.title,
    "",
    "### 正文复制",
    "",
    "请复制 `douyin_caption.md` 内容。",
    "",
    "## 04 发布后回填数据",
    "",
    "发布后请填写：",
    "",
    "- analytics_snapshot.json",
    "",
    "建议记录：",
    "",
    "- 曝光 / 阅读 / 播放",
    "- 点赞",
    "- 收藏",
    "- 评论",
    "- 分享",
    "- 新增关注",
    "- 表现最好的一页",
    "- 表现最弱的一页",
    "- 评论区高频问题",
    "",
    "## 05 文件位置",
    "",
    `当前内容包目录：${outputDir}`,
    "",
    "## 06 注意",
    "",
    "当前为半自动流程，不会自动发布到小红书或抖音。",
    "请人工检查图片、文案和标签后再发布。"
  ].join("\n");
}

function buildAnalyticsSnapshot(outline) {
  return {
    topic: outline.topic,
    title: outline.title,
    created_at: nowISOString(),
    xiaohongshu: {
      publish_url: "",
      views: 0,
      likes: 0,
      favorites: 0,
      comments: 0,
      shares: 0,
      new_followers: 0,
      top_comments: [],
      best_page: "",
      weakest_page: ""
    },
    douyin: {
      publish_url: "",
      views: 0,
      likes: 0,
      favorites: 0,
      comments: 0,
      shares: 0,
      completion_rate: 0,
      profile_visits: 0,
      new_followers: 0,
      top_comments: [],
      best_page: "",
      weakest_page: ""
    },
    manual_notes: ""
  };
}

function buildPublishRecord(outline, pages) {
  return {
    topic: outline.topic,
    title: outline.title,
    mode: "manual",
    status: "manual_publish_ready",
    image_count: pages.length,
    created_at: nowISOString(),
    platforms: {
      xiaohongshu: {
        status: "pending_manual_publish",
        publish_url: "",
        published_at: ""
      },
      douyin: {
        status: "pending_manual_publish",
        publish_url: "",
        published_at: ""
      }
    }
  };
}

function buildPreviewHtml(outline, pages) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeXml(outline.title)}｜图文预览</title>
  <style>
    body {
      margin: 0;
      padding: 32px;
      background: #eef4ff;
      font-family: Arial, "Microsoft YaHei", sans-serif;
      color: #0b1f4d;
    }
    h1 {
      margin: 0 0 24px;
      font-size: 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }
    .card {
      background: white;
      border-radius: 18px;
      padding: 14px;
      box-shadow: 0 10px 30px rgba(15, 45, 90, 0.12);
    }
    img {
      width: 100%;
      display: block;
      border-radius: 12px;
    }
    .meta {
      margin-top: 10px;
      font-size: 14px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <h1>${escapeXml(outline.title)}｜图文预览</h1>
  <div class="grid">
    ${pages
      .map(
        (page) => `
      <div class="card">
        <img src="./images/page_${String(page.page_number).padStart(2, "0")}.svg" alt="page ${page.page_number}" />
        <div class="meta">第 ${page.page_number} 页｜${escapeXml(page.page_title)}</div>
      </div>`
      )
      .join("\n")}
  </div>
</body>
</html>`;
}

function run() {
  const inputPath = path.resolve(process.argv[2] || DEFAULT_INPUT);

  console.log("🚀 开始生成半自动图文内容包");
  console.log(`📄 输入大纲：${inputPath}`);

  const outline = loadOutline(inputPath);
  const pages = buildPages(outline);
  const date = todayString();
  const slug = slugify(outline.topic || outline.title);
  const outputDir = path.join(OUTPUT_ROOT, `${date}_${slug}`);

  ensureDir(outputDir);
  ensureDir(path.join(outputDir, "images"));
  ensureDir(path.join(outputDir, "image_prompts"));

  const totalPages = pages.length;

  const pageScript = pages.map((page) => ({
    ...page,
    image_prompt: makeImagePrompt(outline, page, totalPages),
    design_notes: [
      "蓝色严谨专业风",
      "高级商务信息图",
      "咨询公司报告式排版",
      "强标题层级",
      "大留白",
      "精准网格系统",
      "统一蓝色线性图标"
    ]
  }));

  for (const page of pageScript) {
    const pageNo = String(page.page_number).padStart(2, "0");
    const svg = renderSvg(outline, page, totalPages);
    writeText(path.join(outputDir, "images", `page_${pageNo}.svg`), svg);
    writeText(path.join(outputDir, "image_prompts", `page_${pageNo}_prompt.txt`), page.image_prompt);
  }

  writeJson(path.join(outputDir, "page_script.json"), pageScript);
  writeText(path.join(outputDir, "xiaohongshu_caption.md"), buildXiaohongshuCaption(outline, pages));
  writeText(path.join(outputDir, "douyin_caption.md"), buildDouyinCaption(outline, pages));
  writeText(path.join(outputDir, "manual_publish_guide.md"), buildManualPublishGuide(outline, outputDir, pages));
  writeJson(path.join(outputDir, "analytics_snapshot.json"), buildAnalyticsSnapshot(outline));
  writeJson(path.join(outputDir, "publish_record.json"), buildPublishRecord(outline, pages));
  writeText(path.join(outputDir, "preview.html"), buildPreviewHtml(outline, pages));

  const summary = {
    status: "success",
    mode: "manual",
    topic: outline.topic,
    title: outline.title,
    page_count: totalPages,
    output_dir: outputDir,
    files: [
      "page_script.json",
      "xiaohongshu_caption.md",
      "douyin_caption.md",
      "manual_publish_guide.md",
      "analytics_snapshot.json",
      "publish_record.json",
      "preview.html",
      "images/page_01.svg ...",
      "image_prompts/page_01_prompt.txt ..."
    ]
  };

  writeJson(path.join(outputDir, "generation_summary.json"), summary);

  console.log("✅ 图文内容包生成完成");
  console.log(`📁 输出目录：${outputDir}`);
  console.log(`🖼️ 图片页数：${totalPages}`);
  console.log("📌 当前为半自动流程：请人工检查后发布到小红书 / 抖音");
}

try {
  run();
} catch (error) {
  console.error("❌ 生成失败");
  console.error(error);
  process.exit(1);
}
