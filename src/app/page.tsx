export default function HomePage() {
  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Chuyi Content System is running</h1>
      <p>Cloud deployment is active.</p>
    </main>
  );
}export default function HomePage() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '64px auto', padding: '0 24px', lineHeight: 1.6 }}>
      <h1>Chuyi Content System is running</h1>
      <p>初一内容系统的云端 Next.js 服务已运行，可承接 OAuth callback 和半自动发布接口。</p>
      <ul>
        <li><code>/api/social/config/check</code></li>
        <li><code>/api/social/douyin/start</code></li>
        <li><code>/api/social/douyin/callback</code></li>
        <li><code>/api/social/xiaohongshu/start</code></li>
        <li><code>/api/social/xiaohongshu/callback</code></li>
        <li><code>/api/social/publish/execute</code></li>
      </ul>
    </main>
  );
}
