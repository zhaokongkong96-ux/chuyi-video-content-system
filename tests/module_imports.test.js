import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const SOCIAL_MODULES = [
  "oauthConfig",
  "publishExecute",
  "contentStorage",
  "manualPublishGuide",
  "publishRecordStorage",
];

const ROUTE_FILES = [
  "src/app/api/social/config/check/route.ts",
  "src/app/api/social/douyin/start/route.ts",
  "src/app/api/social/douyin/callback/route.ts",
  "src/app/api/social/xiaohongshu/start/route.ts",
  "src/app/api/social/xiaohongshu/callback/route.ts",
  "src/app/api/social/publish/execute/route.ts",
  // Legacy root-app routes caused Vercel default-import build failures in older commits.
  // Keep these paths guarded if they ever reappear during conflict resolution.
  "app/api/social/config/check/route.js",
  "app/api/social/douyin/start/route.js",
  "app/api/social/douyin/callback/route.js",
  "app/api/social/xiaohongshu/start/route.js",
  "app/api/social/xiaohongshu/callback/route.js",
  "app/api/social/publish/execute/route.js",
];

function repoPath(path) {
  return join(process.cwd(), path);
}

function readRepoFile(path) {
  return readFileSync(repoPath(path), "utf8");
}

function existingRouteFiles() {
  return ROUTE_FILES.filter((routeFile) => existsSync(repoPath(routeFile)));
}

test("App Router routes use named imports for src/social modules", () => {
  for (const routeFile of existingRouteFiles()) {
    const source = readRepoFile(routeFile);
    for (const moduleName of SOCIAL_MODULES) {
      const defaultImportPattern = new RegExp(`import\\s+\\w+\\s+from\\s+['\"][^'\"]*${moduleName}\\.js['\"]`);
      assert.equal(
        defaultImportPattern.test(source),
        false,
        `${routeFile} must not default-import ${moduleName}.js because src/social modules use named exports`,
      );
    }
    assert.equal(/require\(/.test(source), false, `${routeFile} must not use require()`);
    assert.equal(/module\.exports|exports\./.test(source), false, `${routeFile} must not use CommonJS exports`);
    assert.match(source, /export\s+async\s+function\s+(GET|POST)\s*\(/, `${routeFile} must export an App Router handler`);
  }
});

test("legacy root app publish route is absent or uses named social imports", () => {
  const legacyRoute = "app/api/social/publish/execute/route.js";
  if (!existsSync(repoPath(legacyRoute))) {
    assert.ok(true, `${legacyRoute} is absent; src/app route is the canonical implementation`);
    return;
  }

  const source = readRepoFile(legacyRoute);
  assert.match(source, /import\s+\{\s*getOAuthRedirectUris\s*\}\s+from\s+['\"][^'\"]*oauthConfig\.js['\"];/);
  assert.match(source, /import\s+\{\s*executePublish\s*\}\s+from\s+['\"][^'\"]*publishExecute\.js['\"];/);
  assert.equal(/const\s+\{\s*getOAuthRedirectUris\s*\}\s*=/.test(source), false);
  assert.equal(/const\s+\{\s*executePublish\s*\}\s*=/.test(source), false);
});

test("src/social modules use ESM exports instead of CommonJS", () => {
  for (const moduleName of SOCIAL_MODULES) {
    const source = readRepoFile(`src/social/${moduleName}.js`);
    assert.equal(/module\.exports|exports\./.test(source), false, `${moduleName}.js must not use CommonJS exports`);
    assert.equal(/require\(/.test(source), false, `${moduleName}.js must not use require()`);
    assert.match(source, /export\s+(function|class|const|async\s+function)\s+/, `${moduleName}.js must use named ESM exports`);
  }
});
