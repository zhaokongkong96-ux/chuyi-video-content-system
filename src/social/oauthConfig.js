const LOCALHOST_PATTERNS = [/localhost/i, /127\.0\.0\.1/, /\[::1\]/];

export function hasLocalhost(value) {
  return LOCALHOST_PATTERNS.some((pattern) => pattern.test(value || ""));
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

export function assertPublicUrl(name, value) {
  if (!value) {
    throw new Error(`${name} is required for cloud deployment.`);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch (error) {
    throw new Error(`${name} must be a valid absolute URL.`);
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error(`${name} must use http or https.`);
  }

  if (hasLocalhost(parsed.hostname)) {
    throw new Error(`${name} must use a cloud public address, not localhost. Configure NEXT_PUBLIC_APP_URL / platform redirect_uri with the deployed domain.`);
  }

  return parsed;
}

export function getCloudAppUrl(env = process.env) {
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  assertPublicUrl("NEXT_PUBLIC_APP_URL", appUrl);
  return trimTrailingSlash(appUrl);
}

export function buildDefaultRedirectUris(appUrl) {
  return {
    douyin: `${appUrl}/api/social/douyin/callback`,
    xiaohongshu: `${appUrl}/api/social/xiaohongshu/callback`,
  };
}

export function getOAuthRedirectUris(env = process.env) {
  const appUrl = getCloudAppUrl(env);
  const defaults = buildDefaultRedirectUris(appUrl);
  const redirectUris = {
    douyin: env.DOUYIN_REDIRECT_URI || defaults.douyin,
    xiaohongshu: env.XHS_REDIRECT_URI || defaults.xiaohongshu,
  };

  assertPublicUrl("DOUYIN_REDIRECT_URI", redirectUris.douyin);
  assertPublicUrl("XHS_REDIRECT_URI", redirectUris.xiaohongshu);

  return {
    appUrl,
    redirectUris,
  };
}
