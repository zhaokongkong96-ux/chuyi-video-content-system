const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_CONTENT_ROOT = "/content";

function isPublicHttpUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) && !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  } catch (error) {
    return false;
  }
}

function normalizePageScript(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (Array.isArray(raw?.content_pages)) {
    return raw.content_pages;
  }
  if (Array.isArray(raw?.pages)) {
    return raw.pages;
  }
  return raw;
}

class FilesystemContentStorage {
  constructor(options = {}) {
    this.mode = "filesystem";
    this.contentRoot = options.contentRoot || process.env.CONTENT_ROOT || DEFAULT_CONTENT_ROOT;
    this.assetPublicBaseUrl = options.assetPublicBaseUrl || process.env.ASSET_PUBLIC_BASE_URL || "";
  }

  topicDir(topic) {
    return path.join(this.contentRoot, topic);
  }

  async readIfExists(filePath, parser = (value) => value) {
    try {
      const text = await fs.readFile(filePath, "utf8");
      return parser(text);
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  async getPageScripts(topic) {
    return this.readIfExists(path.join(this.topicDir(topic), "page_script.json"), (text) => normalizePageScript(JSON.parse(text)));
  }

  async getCaptions(topic) {
    const dir = this.topicDir(topic);
    const [xiaohongshu, douyin] = await Promise.all([
      this.readIfExists(path.join(dir, "xiaohongshu_caption.md")),
      this.readIfExists(path.join(dir, "douyin_caption.md")),
    ]);
    return { xiaohongshu, douyin };
  }

  async getImageAssets(topic) {
    const imageDir = path.join(this.topicDir(topic), "images");
    let names = [];
    try {
      names = await fs.readdir(imageDir);
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }

    return names
      .filter((name) => /^page_\d+\.(png|jpe?g|webp)$/i.test(name))
      .sort()
      .map((name, index) => {
        const pageMatch = name.match(/page_(\d+)/i);
        const page = pageMatch ? Number(pageMatch[1]) : index + 1;
        const publicUrl = this.assetPublicBaseUrl
          ? `${this.assetPublicBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(topic)}/images/${name}`
          : null;
        return {
          page,
          url: publicUrl,
          download_url: publicUrl,
          storage_status: publicUrl ? "uploaded" : "not_uploaded_to_cloud_storage",
          local_path: path.join(imageDir, name),
        };
      });
  }

  async getContentPackage(topic) {
    const [page_script, captions, image_assets] = await Promise.all([
      this.getPageScripts(topic),
      this.getCaptions(topic),
      this.getImageAssets(topic),
    ]);
    if (!page_script && !captions.xiaohongshu && !captions.douyin && image_assets.length === 0) {
      return null;
    }
    return { topic, page_script, captions, image_assets };
  }

  async saveManualPublishGuide(topic, data) {
    const dir = this.topicDir(topic);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, "manual_publish_guide.json");
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    if (this.assetPublicBaseUrl) {
      return `${this.assetPublicBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(topic)}/manual_publish_guide.json`;
    }
    return `not_uploaded_to_cloud_storage:${filePath}`;
  }

  async savePublishRecord(topic, data) {
    const dir = this.topicDir(topic);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, "publish_record.json");
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    return { ...data, storage_url: this.assetPublicBaseUrl ? `${this.assetPublicBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(topic)}/publish_record.json` : null };
  }

  async saveAnalyticsSnapshot(topic, data) {
    const dir = this.topicDir(topic);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, "analytics_snapshot.json");
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    return { ...data, storage_url: this.assetPublicBaseUrl ? `${this.assetPublicBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(topic)}/analytics_snapshot.json` : null };
  }
}

const COMPLETE_MOCK_TOPIC = "cloud-ready-demo";
const INCOMPLETE_MOCK_TOPIC = "incomplete-demo";

function createMockContentPackage(topic = COMPLETE_MOCK_TOPIC) {
  const pages = [
    { page_number: 1, page_title: "封面页" },
    { page_number: 2, page_title: "问题引入" },
    { page_number: 3, page_title: "方法框架" },
  ];
  return {
    topic,
    page_script: pages,
    captions: {
      xiaohongshu: "# 小红书标题\n\n正文复制区\n\n#初一 #设计策略",
      douyin: "# 抖音标题\n\n正文复制区\n\n#产品经理 #设计策略",
    },
    image_assets: pages.map((page) => ({
      page: page.page_number,
      url: `https://mock-storage.example.com/content/${topic}/images/page_${String(page.page_number).padStart(2, "0")}.png`,
      download_url: `https://mock-storage.example.com/content/${topic}/images/page_${String(page.page_number).padStart(2, "0")}.png?download=1`,
      storage_status: "uploaded",
    })),
  };
}

class MockCloudContentStorage {
  constructor(options = {}) {
    this.mode = "cloud";
    this.packages = new Map(Object.entries(options.packages || {
      [COMPLETE_MOCK_TOPIC]: createMockContentPackage(COMPLETE_MOCK_TOPIC),
      [INCOMPLETE_MOCK_TOPIC]: {
        topic: INCOMPLETE_MOCK_TOPIC,
        page_script: [{ page_number: 1, page_title: "封面页" }, { page_number: 2, page_title: "方法页" }],
        captions: { xiaohongshu: "只有小红书文案", douyin: "" },
        image_assets: [{ page: 1, url: "https://mock-storage.example.com/content/incomplete-demo/images/page_01.png" }],
      },
    }));
    this.savedManualGuides = new Map();
    this.savedPublishRecords = new Map();
    this.savedAnalyticsSnapshots = new Map();
  }

  async getContentPackage(topic) {
    return this.packages.get(topic) || null;
  }

  async getPageScripts(topic) {
    return (await this.getContentPackage(topic))?.page_script || null;
  }

  async getCaptions(topic) {
    return (await this.getContentPackage(topic))?.captions || { xiaohongshu: null, douyin: null };
  }

  async getImageAssets(topic) {
    return (await this.getContentPackage(topic))?.image_assets || [];
  }

  async saveManualPublishGuide(topic, data) {
    this.savedManualGuides.set(topic, data);
    return `https://mock-storage.example.com/content/${topic}/manual_publish_guide.json`;
  }

  async savePublishRecord(topic, data) {
    this.savedPublishRecords.set(topic, data);
    return { ...data, storage_url: `https://mock-storage.example.com/content/${topic}/publish_record.json` };
  }

  async saveAnalyticsSnapshot(topic, data) {
    this.savedAnalyticsSnapshots.set(topic, data);
    return { ...data, storage_url: `https://mock-storage.example.com/content/${topic}/analytics_snapshot.json` };
  }
}

function createContentStorage(options = {}) {
  const mode = options.mode || process.env.CONTENT_STORAGE_MODE || "cloud";
  if (mode === "filesystem") {
    return new FilesystemContentStorage(options);
  }
  if (mode === "cloud") {
    return new MockCloudContentStorage(options);
  }
  throw new Error(`Unsupported CONTENT_STORAGE_MODE: ${mode}`);
}

module.exports = {
  COMPLETE_MOCK_TOPIC,
  FilesystemContentStorage,
  INCOMPLETE_MOCK_TOPIC,
  MockCloudContentStorage,
  createContentStorage,
  createMockContentPackage,
  isPublicHttpUrl,
  normalizePageScript,
};
