'use client'

import Link from 'next/link'
import { useAccount } from './AccountProvider'
import { useLang } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import { accountFetch } from '@/lib/account/browser'

export function AccountLink() {
  const { user } = useAccount()
  const { lang } = useLang()
  const [name, setName] = useState('')
  useEffect(() => { let active = true; if (user) void accountFetch<{profile: {display_name: string}}>('/api/profile').then(r => { if (active) setName(r.profile.display_name) }).catch(() => {}); return () => { active = false } }, [user])
  return <Link className="account-link" href={user ? '/account' : '/login'}>{user ? (name || (lang === 'en' ? 'My account' : '我的账号')) : (lang === 'en' ? 'Sign in' : '登录 / 注册')}{user?.email && <small> · {user.email}</small>}</Link>
}
export function RequireAccount({ children }: { children: React.ReactNode }) {
  const { user, ready, configured } = useAccount()
  const { lang } = useLang()
  if (!ready) return <div className="account-notice" role="status">{lang === 'en' ? 'Loading your account…' : '正在读取账号…'}</div>
  if (user) return <>{children}</>
  return <div className="account-notice"><span>YOUR PERSONAL SPACE</span><h2>{lang === 'en' ? 'Make this space yours.' : '拥有你自己的研究空间。'}</h2><p>{lang === 'en' ? 'Sign in to save conversations and continue learning across devices.' : '登录后保存对话与学习进度，换设备也能继续。'}</p>{configured ? <Link href="/login">{lang === 'en' ? 'Sign in / Create account' : '登录 / 创建账号'} →</Link> : <p role="status">{lang === 'en' ? 'Account service is awaiting setup.' : '账号服务正在配置中。'}</p>}</div>
}
