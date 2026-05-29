const assert = require("node:assert/strict");
const test = require("node:test");

const { MockCloudContentStorage, createMockContentPackage, INCOMPLETE_MOCK_TOPIC } = require("../src/social/contentStorage");
const { getOAuthRedirectUris } = require("../src/social/oauthConfig");
const { executePublish } = require("../src/social/publishExecute");

test("confirmed=false is rejected", async () => {
  const result = await executePublish({ topic: "cloud-ready-demo", confirmed: false }, {
    contentStorage: new MockCloudContentStorage(),
  });
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.code, "confirmation_required");
});

test("missing topic returns a clear error", async () => {
  const result = await executePublish({ topic: "missing-topic", confirmed: true }, {
    contentStorage: new MockCloudContentStorage({ packages: {} }),
  });
  assert.equal(result.statusCode, 404);
  assert.equal(result.body.code, "topic_not_found");
  assert.deepEqual(result.body.missing, ["content_package"]);
});

test("incomplete content package returns missing items", async () => {
  const result = await executePublish({ topic: INCOMPLETE_MOCK_TOPIC, confirmed: true }, {
    contentStorage: new MockCloudContentStorage(),
  });
  assert.equal(result.statusCode, 422);
  assert.equal(result.body.code, "content_package_incomplete");
  assert.match(result.body.missing.join(","), /douyin_caption/);
  assert.match(result.body.missing.join(","), /image_count_matches_page_count/);
});

test("cloud storage mock can return content package", async () => {
  const storage = new MockCloudContentStorage();
  const contentPackage = await storage.getContentPackage("cloud-ready-demo");
  assert.equal(contentPackage.topic, "cloud-ready-demo");
  assert.equal(contentPackage.image_assets.length, contentPackage.page_script.length);
});

test("execute can generate manual_publish_ready", async () => {
  const topic = "launch-checklist";
  const storage = new MockCloudContentStorage({
    packages: {
      [topic]: createMockContentPackage(topic),
    },
  });
  const result = await executePublish({ topic, confirmed: true }, { contentStorage: storage });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.status, "manual_publish_ready");
  assert.equal(result.body.content_source, "cloud");
  assert.equal(result.body.image_assets.length, 3);
  assert.equal(result.body.xiaohongshu_caption_ready, true);
  assert.equal(result.body.douyin_caption_ready, true);
  assert.match(result.body.manual_publish_guide_url, /^https:\/\/mock-storage\.example\.com/);
});

test("localhost redirect_uri gives a clear cloud configuration error", () => {
  assert.throws(() => getOAuthRedirectUris({
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  }), /cloud public address, not localhost/);

  assert.throws(() => getOAuthRedirectUris({
    NEXT_PUBLIC_APP_URL: "https://app.example.com",
    DOUYIN_REDIRECT_URI: "http://127.0.0.1:3000/api/social/douyin/callback",
    XHS_REDIRECT_URI: "https://app.example.com/api/social/xiaohongshu/callback",
  }), /cloud public address, not localhost/);
});
