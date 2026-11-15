import { PGlite } from '@electric-sql/pglite'
import { readdir, readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import type { SupabaseClient } from '@supabase/supabase-js'
import { localDemoEnabled } from './config'

const state = globalThis as typeof globalThis & { omniaiLocalDB?: Promise<PGlite> }
export function localDatabase(): Promise<PGlite> {
  if (!localDemoEnabled()) throw new Error('Local demo is disabled')
  return state.omniaiLocalDB ??= initialize()
}
async function initialize() {
  const root = path.resolve(process.env.OMNIAI_DATA_DIR || './local-data')
  await mkdir(root, { recursive: true })
  const db = new PGlite(path.join(root, 'postgres'))
  await db.waitReady
  await db.exec('create table if not exists public.local_migrations(name text primary key)')
  if (!(await db.query("select name from public.local_migrations where name='bootstrap'")).rows.length) {
    await db.exec(`begin;
      create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, email text unique not null, password_hash text not null,
        raw_user_meta_data jsonb not null default '{}', created_at timestamptz default now(),
        last_sign_in_at timestamptz, email_confirmed_at timestamptz);
      create table auth.local_sessions(token_hash text primary key, user_id uuid references auth.users(id), expires_at timestamptz not null);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth, public to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      insert into public.local_migrations values ('bootstrap'); commit;`)
  }
  const dir = path.join(process.cwd(), 'supabase', 'migrations')
  for (const name of (await readdir(dir)).filter(n => n.endsWith('.sql')).sort()) {
    if ((await db.query('select name from public.local_migrations where name=$1', [name])).rows.length) continue
    const sql = (await readFile(path.join(dir, name), 'utf8')).replace(/commit;\s*$/i, '')
    await db.exec(sql)
    await db.query('insert into public.local_migrations values ($1)', [name])
    await db.exec('commit')
  }
  return db
}
const ident = (s: string) => { if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error('Invalid identifier'); return `"${s}"` }
const columns = (s: string) => s === '*' ? '*' : s.split(',').map(v => ident(v.trim())).join(',')
type Result = { data: unknown; error: { message: string; code?: string } | null }
/** Server-only adapter: every operation uses original authenticated RLS policies. */
export function localClient(userId: string): SupabaseClient {
  const run = async (sql: string, params: unknown[] = []): Promise<Result> => {
    try {
      const db = await localDatabase()
      const result = await db.transaction(async tx => {
        await tx.exec('set local role authenticated')
        await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [userId])
        return tx.query(sql, params)
      })
      return { data: result.rows, error: null }
    } catch (error) { const e = error as Error & { code?: string }; return { data: null, error: { message: e.message, code: e.code } } }
  }
  class Query implements PromiseLike<Result> {
    private cols = '*'; private action = 'select'; private values: Record<string, unknown> = {}; private filters: [string, unknown][] = []
    private orders: string[] = []; private cap = ''; private conflict = ''; private one: 'single' | 'maybe' | undefined
    constructor(private table: string) { ident(table) }
    select(s = '*') { this.cols = columns(s); return this }
    eq(k: string, v: unknown) { this.filters.push([ident(k), v]); return this }
    order(k: string, o?: { ascending?: boolean }) { this.orders.push(`${ident(k)} ${o?.ascending === false ? 'desc' : 'asc'}`); return this }
    limit(n: number) { if (!Number.isInteger(n) || n < 0 || n > 1000) throw new Error('Invalid limit'); this.cap = ` limit ${n}`; return this }
    single() { this.one = 'single'; return this }
    maybeSingle() { this.one = 'maybe'; return this }
    update(v: Record<string, unknown>) { this.action = 'update'; this.values = v; return this }
    delete() { this.action = 'delete'; return this }
    upsert(v: Record<string, unknown>, o: { onConflict: string }) { this.action = 'upsert'; this.values = v; this.conflict = columns(o.onConflict); return this }
    async execute(): Promise<Result> {
      const params: unknown[] = []
      const bind = (v: unknown) => { params.push(v !== null && typeof v === 'object' ? JSON.stringify(v) : v); return `$${params.length}` }
      const entries = Object.entries(this.values)
      let sql = this.action === 'select' ? `select ${this.cols} from public.${ident(this.table)}`
        : this.action === 'update' ? `update public.${ident(this.table)} set ${entries.map(([k,v]) => `${ident(k)}=${bind(v)}`).join(',')}`
        : this.action === 'delete' ? `delete from public.${ident(this.table)}`
        : `insert into public.${ident(this.table)} (${entries.map(([k]) => ident(k)).join(',')}) values (${entries.map(([,v]) => bind(v)).join(',')}) on conflict (${this.conflict}) do update set ${entries.map(([k]) => `${ident(k)}=excluded.${ident(k)}`).join(',')}`
      if (this.filters.length) sql += ` where ${this.filters.map(([k,v]) => `${k}=${bind(v)}`).join(' and ')}`
      if (this.action === 'select') { if (this.orders.length) sql += ` order by ${this.orders.join(',')}`; sql += this.cap }
      else sql += ` returning ${this.cols}`
      const r = await run(sql, params)
      if (r.error || !this.one) return r
      const rows = r.data as unknown[]
      if (rows.length > 1 || (this.one === 'single' && !rows.length)) return { data: null, error: { code: 'PGRST116', message: 'Expected one row' } }
      return { data: rows[0] ?? null, error: null }
    }
    then<A = Result, B = never>(yes?: ((r: Result) => A | PromiseLike<A>) | null, no?: ((reason: unknown) => B | PromiseLike<B>) | null) { return this.execute().then(yes, no) }
  }
  return {
    from: (table: string) => new Query(table),
    rpc: async (name: string, args: Record<string, unknown> = {}) => {
      const entries = Object.entries(args)
      const r = await run(`select public.${ident(name)}(${entries.map(([k],i) => `${ident(k)} => $${i+1}`).join(',')}) as result`, entries.map(([,v]) => v !== null && typeof v === 'object' ? JSON.stringify(v) : v))
      return r.error ? r : { data: (r.data as { result: unknown }[])[0]?.result, error: null }
    },
  } as unknown as SupabaseClient
}
