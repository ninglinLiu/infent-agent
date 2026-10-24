/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the opt-in local staging build separate from normal production artifacts.
  distDir: process.env.INFENT_STAGING === '1' ? '.next-staging' : '.next',
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/', destination: '/login', permanent: false }]
  },
  async headers() {
    return [{ source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] }]
  },
}

module.exports = nextConfig
