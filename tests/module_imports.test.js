import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
];

function readRepoFile(path) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

test("App Router routes use named imports for src/social modules", () => {
  for (const routeFile of ROUTE_FILES) {
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

test("src/social modules use ESM exports instead of CommonJS", () => {
  for (const moduleName of SOCIAL_MODULES) {
    const source = readRepoFile(`src/social/${moduleName}.js`);
    assert.equal(/module\.exports|exports\./.test(source), false, `${moduleName}.js must not use CommonJS exports`);
    assert.equal(/require\(/.test(source), false, `${moduleName}.js must not use require()`);
    assert.match(source, /export\s+(function|class|const|async\s+function)\s+/, `${moduleName}.js must use named ESM exports`);
  }
});
