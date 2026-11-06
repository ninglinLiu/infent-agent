/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the opt-in local staging build separate from normal production artifacts.
  distDir: process.env.INFENT_STAGING === '1' ? '.next-staging' : '.next',
  reactStrictMode: true,
  async redirects() {
    // 根路径现在是宣传页；旧的展示页并入宣传页（组件文件保留，便于回滚）
    return [{ source: '/about', destination: '/', permanent: false }]
  },
  async headers() {
    return [
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
      // 学习室的历史行情是静态快照，让 CDN 和浏览器缓存一天
      { source: '/data/history/:file*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400' }] },
    ]
  },
}

module.exports = nextConfig
