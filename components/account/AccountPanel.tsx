'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { accountFetch, browserAccount } from '@/lib/account/browser'
import { useLang } from '@/lib/i18n'
import { useAccount } from './AccountProvider'
import { RequireAccount } from './AccountAccess'
import { useLearning } from '@/components/academy/LearningProvider'

function Profile() {
  const { lang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [symbol, setSymbol] = useState('')
  const [items, setItems] = useState<{ symbol: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [notice, setNotice] = useState('')
  const { data: learning, ready: learningReady, error: learningError, retry } = useLearning()
  const { user } = useAccount()
  const load = useCallback(async () => {
    try {
      const [profile, watch] = await Promise.all([
        accountFetch<{ profile: { display_name: string }; email: string }>('/api/profile'),
        accountFetch<{ items: { symbol: string }[] }>('/api/watchlist'),
      ])
      setName(profile.profile.display_name); setEmail(profile.email); setItems(watch.items); setLoaded(true); setNotice('')
    } catch (error) { setNotice((error as Error).message) }
  }, [])
  useEffect(() => { void load() }, [load])
  async function action(work: () => Promise<void>) {
    setBusy(true); setNotice('')
    try { await work() } catch (error) { setNotice((error as Error).message) }
    finally { setBusy(false) }
  }
  async function changeWatch(value: string, remove = false) {
    await accountFetch('/api/watchlist', { method: remove ? 'DELETE' : 'POST', body: JSON.stringify({ symbol: value }) })
    const result = await accountFetch<{ items: { symbol: string }[] }>('/api/watchlist')
    setItems(result.items); setSymbol('')
  }
  return <>
    <section className="account-card"><span className="account-eyebrow">YOUR PERSONAL WORKSPACE</span><h1>{tr('我的账号', 'My account')}</h1><p>{email}</p>
      <p>{tr('注册时间', 'Registered')}: {user?.created_at ? new Date(user.created_at).toLocaleString() : '—'}<br />{tr('最近登录', 'Last sign-in')}: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—'}</p>
      <details><summary>{tr('已解锁课程', 'Unlocked courses')}</summary><p>{tr('可口可乐完整基础案例 · 免费', 'Complete Coca-Cola basic case · Free')}</p>{learning.entitlements.filter(e => e.active).map(e => <p key={e.package_id}>{tr('价值投资进阶案例包', 'Advanced value cases')} · {e.source === 'demo' ? tr('演示权益', 'Demo access') : tr('付款权益', 'Payment access')} · {tr('正式内容筹备中', 'Content in preparation')}</p>)}{!learningReady && <p>{tr('正在读取权益…', 'Loading access…')}</p>}{learningError && <p role="alert">{learningError}<button onClick={() => void retry()}>{tr('重试', 'Retry')}</button></p>}</details>
      <form onSubmit={event => { event.preventDefault(); void action(async () => {
        await accountFetch('/api/profile', { method: 'PATCH', body: JSON.stringify({ display_name: name, language: lang }) })
        setNotice(tr('个人资料已保存。', 'Profile saved.'))
      }) }}><label>{tr('昵称', 'Display name')}<input value={name} onChange={e => setName(e.target.value)} required maxLength={20} /></label><button className="account-primary" disabled={busy || !loaded}>{tr('保存资料', 'Save profile')}</button></form>
      <div className="account-actions"><Link href="/dashboard">{tr('进入工作台', 'Open workspace')} →</Link><button disabled={busy} onClick={() => void action(async () => {
        const result = await browserAccount()?.auth.signOut()
        if (result?.error) throw result.error
        location.assign('/login')
      })}>{tr('退出登录', 'Sign out')}</button></div>
      <p>{tr('退出后云端记录会保留。', 'Your cloud records are kept after signing out.')}</p>
      {notice && <p role="status" className="account-feedback">{notice}</p>}{!loaded && <button disabled={busy} onClick={() => void load()}>{tr('重新加载', 'Retry loading')}</button>}
    </section>
    <section className="account-card"><h2>{tr('我的自选列表', 'My watchlist')}</h2><p>{tr('只有你的账号可以读取和编辑此列表。', 'Only your account can read and edit this list.')}</p>
      <form onSubmit={event => { event.preventDefault(); void action(() => changeWatch(symbol)) }}><label>{tr('标的代码，例如 AAPL、BTC', 'Symbol, e.g. AAPL, BTC')}<input value={symbol} maxLength={20} required onChange={e => setSymbol(e.target.value)} /></label><button className="account-primary" disabled={busy || !loaded}>{tr('加入自选', 'Add to watchlist')}</button></form>
      {!items.length && loaded && <p>{tr('还没有自选标的，从一个感兴趣的代码开始。', 'Your watchlist is empty. Add a symbol to get started.')}</p>}
      {items.map(item => <div className="account-watch-item" key={item.symbol}><span>{item.symbol}</span><button disabled={busy} aria-label={`${tr('移除', 'Remove')} ${item.symbol}`} onClick={() => void action(() => changeWatch(item.symbol, true))}>{tr('移除', 'Remove')}</button></div>)}
    </section>
  </>
}
export function AccountPanel() {
  const { user } = useAccount()
  return <main className="account-page"><header><Link href="/dashboard">← omniAI</Link></header><RequireAccount><Profile key={user?.id} /></RequireAccount></main>
}
