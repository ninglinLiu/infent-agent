'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { browserAccount } from '@/lib/account/browser'
import { accountConfig, safeReturnPath } from '@/lib/account/config'
import { accountTransport } from '@/lib/account/fetch'
import { useLang } from '@/lib/i18n'

export function LoginForm({ reset = false }: { reset?: boolean }) {
  const { lang, setLang } = useLang()
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const client = browserAccount()
  useEffect(() => { if (new URLSearchParams(location.search).has('error')) setNotice(lang === 'en' ? 'This link is invalid or expired. Please try again.' : '链接无效或已过期，请重试。') }, [lang])
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!client || busy) return
    setBusy(true); setNotice('')
    try {
      if (reset) {
        const { error } = await client.auth.updateUser({ password })
        if (error) throw error
        location.assign('/account')
      } else if (mode === 'register') {
        // This flow must never send a confirmation email, even if the hosted
        // setting is accidentally re-enabled later.
        const config = accountConfig()!
        const response = await accountTransport(`${config.url}/auth/v1/settings`, { cache: 'no-store', headers: { apikey: config.key } })
        if (!response.ok) throw new Error('Registration unavailable')
        const settings = await response.json()
        if (settings.mailer_autoconfirm !== true) {
          setNotice(tr('注册暂未开放，请稍后再试。已有账号可以直接登录。', 'Registration is temporarily unavailable. Existing users can still sign in.'))
          return
        }
        const { data, error } = await client.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() } } })
        if (error) throw error
        if (data.session) location.assign(safeReturnPath(new URLSearchParams(location.search).get('next')))
        else setNotice(tr('注册暂未完成，请稍后重试；已有账号可以直接登录。', 'Registration could not be completed. Try again later, or sign in if you already have an account.'))
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        location.assign(safeReturnPath(new URLSearchParams(location.search).get('next')))
      }
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'user_already_exists' || code === 'email_exists') setNotice(tr('这个邮箱已经注册，请直接登录。', 'This email is already registered. Please sign in.'))
      else if (code === 'invalid_credentials') setNotice(tr('邮箱或密码不正确，请重试。', 'Incorrect email or password. Please try again.'))
      else if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') setNotice(tr('操作过于频繁，请稍后再试。', 'Too many attempts. Please try again later.'))
      else setNotice(tr('操作未完成，请检查输入或稍后重试。', 'Unable to continue. Check your input or try again later.'))
    }
    finally { setBusy(false) }
  }
  return <main className="account-page"><header><Link href="/dashboard">← omniAI</Link><button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>{lang === 'en' ? '中文' : 'English'}</button></header><section className="account-card"><span className="account-eyebrow">YOUR RESEARCH, YOUR SPACE</span><h1>{reset ? tr('设置新密码', 'Set a new password') : mode === 'register' ? tr('开始你的研究旅程', 'Start your research journey') : tr('欢迎回来', 'Welcome back')}</h1><p>{mode === 'register' && !reset ? tr('设置昵称、邮箱和密码，创建你的个人研究空间。', 'Choose a display name, email, and password for your research space.') : tr('你的对话、学习进度和自选列表，在这里继续。', 'Your conversations, learning progress, and watchlist live here.')}</p>
    {!client ? <p role="status">{tr('账号服务尚未配置，暂时无法登录。', 'Account service is not configured yet.')}</p> : <form onSubmit={submit}>
      {!reset && <label>{tr('邮箱', 'Email')}<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>}
      {mode === 'register' && !reset && <label>{tr('昵称', 'Display name')}<input autoComplete="nickname" required maxLength={20} value={name} onChange={e => setName(e.target.value)} /></label>}
      <label>{tr('密码', 'Password')}<input type="password" autoComplete={reset || mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'login' && !reset ? 1 : 10} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} />{(reset || mode === 'register') && <small>{tr('至少 10 个字符', 'At least 10 characters')}</small>}</label>
      <button className="account-primary" disabled={busy}>{busy ? tr('处理中…', 'Please wait…') : reset ? tr('保存密码', 'Save password') : mode === 'login' ? tr('登录', 'Sign in') : tr('注册并登录', 'Create account & sign in')}</button>
    </form>}
    {notice && <p role="status" className="account-feedback">{notice}</p>}
    {!reset && <><div className="account-actions"><button disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setNotice(''); setPassword('') }}>{mode === 'register' ? tr('已有账号？登录', 'Already registered? Sign in') : tr('创建账号', 'Create an account')}</button></div><div className="account-guest"><Link href="/dashboard">{tr('以访客模式体验', 'Continue as a guest')} →</Link><small>{tr('先看看小屋与交易所；登录后使用 AI 并保存学习进度。', 'Explore the house and Exchange. Sign in to use AI and save learning progress.')}</small></div></>}
  </section></main>
}
