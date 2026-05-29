const { createContentStorage, isPublicHttpUrl } = require("./contentStorage");
const { createAnalyticsSnapshotTemplate, createManualPublishGuide } = require("./manualPublishGuide");
const { createPublishRecordStorage } = require("./publishRecordStorage");

function response(statusCode, body) {
  return { statusCode, body };
}

function getPageCount(pageScript) {
  if (Array.isArray(pageScript)) return pageScript.length;
  if (Array.isArray(pageScript?.content_pages)) return pageScript.content_pages.length;
  if (Array.isArray(pageScript?.pages)) return pageScript.pages.length;
  return 0;
}

function validateContentPackage(topic, contentPackage) {
  const missing = [];
  if (!topic) missing.push("topic");
  if (!contentPackage) {
    return { ok: false, missing: ["content_package"], pageCount: 0, imageCount: 0 };
  }

  const pageCount = getPageCount(contentPackage.page_script);
  const imageAssets = contentPackage.image_assets || [];
  if (!contentPackage.topic) missing.push("topic");
  if (!pageCount) missing.push("page_script");
  if (!contentPackage.captions?.xiaohongshu) missing.push("xiaohongshu_caption");
  if (!contentPackage.captions?.douyin) missing.push("douyin_caption");
  if (!imageAssets.length) missing.push("image_assets");
  if (pageCount && imageAssets.length && imageAssets.length !== pageCount) {
    missing.push("image_count_matches_page_count");
  }

  const inaccessible = imageAssets.filter((asset) => !isPublicHttpUrl(asset.url));
  if (inaccessible.length) {
    missing.push("public_image_urls");
  }

  return {
    ok: missing.length === 0,
    missing,
    pageCount,
    imageCount: imageAssets.length,
    inaccessibleImages: inaccessible.map((asset) => ({ page: asset.page, url: asset.url || null })),
  };
}

async function executePublish(requestBody, options = {}) {
  if (requestBody?.confirmed !== true) {
    return response(400, {
      status: "error",
      code: "confirmation_required",
      message: "confirmed must be true before executing the publish workflow.",
    });
  }

  const topic = requestBody.topic;
  if (!topic) {
    return response(400, {
      status: "error",
      code: "topic_required",
      message: "topic is required.",
    });
  }

  const contentStorage = options.contentStorage || createContentStorage(options.storageOptions);
  const publishRecordStorage = options.publishRecordStorage || createPublishRecordStorage();
  const contentPackage = await contentStorage.getContentPackage(topic);
  const validation = validateContentPackage(topic, contentPackage);

  if (!contentPackage) {
    return response(404, {
      status: "error",
      code: "topic_not_found",
      topic,
      content_source: contentStorage.mode,
      missing: validation.missing,
      message: `No content package found for topic: ${topic}`,
    });
  }

  if (!validation.ok) {
    return response(422, {
      status: "error",
      code: "content_package_incomplete",
      topic,
      content_source: contentStorage.mode,
      missing: validation.missing,
      inaccessible_images: validation.inaccessibleImages,
      message: "Content package is incomplete for cloud manual publishing.",
    });
  }

  const officialApiEnabled = options.officialApiEnabled ?? process.env.SOCIAL_PUBLISH_API_ENABLED === "true";
  if (officialApiEnabled) {
    return response(501, {
      status: "api_publish_not_implemented",
      topic,
      content_source: contentStorage.mode,
      message: "Official platform publish API integration is not implemented in this repository yet.",
    });
  }

  const imageAssets = contentPackage.image_assets.map((asset) => ({
    page: asset.page,
    url: asset.url,
    download_url: asset.download_url || asset.url,
  }));
  const manualGuide = createManualPublishGuide({ topic, contentPackage, imageAssets });
  const publishRecord = await publishRecordStorage.createPublishRecord({
    topic,
    mode: "manual",
    status: "manual_publish_ready",
    image_count: imageAssets.length,
  });
  const analyticsSnapshot = createAnalyticsSnapshotTemplate(topic);

  const [manualPublishGuideUrl] = await Promise.all([
    contentStorage.saveManualPublishGuide(topic, manualGuide),
    contentStorage.savePublishRecord(topic, publishRecord),
    contentStorage.saveAnalyticsSnapshot(topic, analyticsSnapshot),
  ]);

  return response(200, {
    status: "manual_publish_ready",
    topic,
    content_source: contentStorage.mode,
    manual_publish_guide_url: manualPublishGuideUrl,
    image_assets: imageAssets.map(({ page, url }) => ({ page, url })),
    xiaohongshu_caption_ready: Boolean(contentPackage.captions?.xiaohongshu),
    douyin_caption_ready: Boolean(contentPackage.captions?.douyin),
    next_step: "请手动下载/上传图片，并复制文案发布",
  });
}

module.exports = {
  executePublish,
  getPageCount,
  validateContentPackage,
};
