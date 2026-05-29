function splitCaption(caption = "") {
  const lines = caption.trim().split(/\r?\n/).filter(Boolean);
  const titleLine = lines[0] || "";
  const bodyLines = lines.slice(1).filter((line) => !/^#[\p{L}\p{N}_-]+(?:\s+#[\p{L}\p{N}_-]+)*$/u.test(line.trim()));
  const tagMatches = lines.slice(1).join(" ").match(/#[\p{L}\p{N}_-]+/gu) || [];
  return {
    title: titleLine.replace(/^#+\s*/, "").trim(),
    body: bodyLines.join("\n").trim() || caption.trim(),
    tags: [...new Set(tagMatches)].join(" "),
  };
}

function createManualPublishGuide({ topic, contentPackage, imageAssets }) {
  const xhs = splitCaption(contentPackage.captions?.xiaohongshu || "");
  const douyin = splitCaption(contentPackage.captions?.douyin || "");
  return {
    topic,
    mode: "manual",
    generated_at: new Date().toISOString(),
    image_assets: imageAssets.map((asset) => ({
      page: asset.page,
      preview_url: asset.url || null,
      download_url: asset.download_url || asset.url || null,
      storage_status: asset.storage_status || "uploaded",
      note: asset.url ? "云端可访问图片 URL" : "当前图片还没有上传到云端存储，请先上传后再发布。",
    })),
    copy_blocks: {
      xiaohongshu: {
        title_copy_area: xhs.title,
        body_copy_area: xhs.body,
        tags_copy_area: xhs.tags,
      },
      douyin: {
        title_copy_area: douyin.title,
        body_copy_area: douyin.body,
        tags_copy_area: douyin.tags,
      },
    },
    post_publish_backfill: {
      instruction: "发布后请回填曝光、点击/完读、收藏、评论、转发、涨粉和高频评论关键词，用于下一次内容优化。",
      required_fields: ["impressions", "clicks", "completion_rate", "saves", "comments", "shares", "followers_delta", "comment_keywords"],
    },
  };
}

function createAnalyticsSnapshotTemplate(topic) {
  return {
    topic,
    created_at: new Date().toISOString(),
    status: "waiting_for_manual_backfill",
    metrics: {
      impressions: null,
      clicks: null,
      completion_rate: null,
      saves: null,
      comments: null,
      shares: null,
      followers_delta: null,
      comment_keywords: [],
      high_engagement_pages: [],
    },
    next_optimization_notes: "发布后根据回填数据补充。",
  };
}

module.exports = {
  createAnalyticsSnapshotTemplate,
  createManualPublishGuide,
  splitCaption,
};
