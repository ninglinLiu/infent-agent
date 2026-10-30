'use client'

import { createBrowserClient } from '@supabase/ssr'
import { accountConfig } from './config'
import { accountTransport } from './fetch'

export function browserAccount() {
  const config = accountConfig()
  return config ? createBrowserClient(config.url, config.key, { global: { fetch: accountTransport } }) : null
}

export async function accountFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await accountTransport(url, { ...init, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...init?.headers } })
  const result = await response.json()
  if (!response.ok) throw Object.assign(new Error(result.error || 'Unable to save. Please retry.'), { status: response.status })
  return result as T
}
