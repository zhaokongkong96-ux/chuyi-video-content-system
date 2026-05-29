export async function GET() {
  return Response.json({
    ok: true,
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    douyinRedirectUri: process.env.DOUYIN_REDIRECT_URI ?? null,
    xhsRedirectUri: process.env.XHS_REDIRECT_URI ?? null,
    hasLocalhost: [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.DOUYIN_REDIRECT_URI,
      process.env.XHS_REDIRECT_URI
    ].some((value) => value?.includes("localhost")),
    hasPlaceholderDomain: [
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.DOUYIN_REDIRECT_URI,
      process.env.XHS_REDIRECT_URI
    ].some((value) =>
      value?.includes("your-cloud-domain.example.com") ||
      value?.includes("<YOUR_CLOUD_DOMAIN>")
    )
  });
