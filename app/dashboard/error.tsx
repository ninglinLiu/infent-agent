'use client'

import Link from 'next/link'

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', gap: 20, padding: 32, background: '#faf8ff', color: '#352942', textAlign: 'center' }}>
    <h1>页面暂时没有打开 · Unable to open this page</h1>
    <p>请重试；如果刚刚更新过网站，请刷新页面。<br />Try again, or reload after a site update.</p>
    <button onClick={reset}>重试 · Try again</button>
    <button onClick={() => window.location.reload()}>刷新页面 · Reload</button>
    <Link href="/">返回首页 · Home</Link>
  </main>
}
