import { test, expect } from './fixtures'
import { PGlite } from '@electric-sql/pglite'
import { readFile, mkdir } from 'node:fs/promises'
import { EMPTY_ACADEMY } from '../../lib/academy'

// Real local PostgreSQL state machine; browser auth/API transport is a test fixture.
// This is NOT evidence of a live Supabase Auth/PostgREST integration.
test('original simulation UI saves, retries, restores, completes and retains old attempts', async ({page},info) => {
  test.skip(info.project.name!=='desktop','Existing desktop learning layout')
  test.setTimeout(120000)
  await page.setViewportSize({width:1440,height:1500})
  const db=new PGlite()
  const uid='00000000-0000-4000-8000-000000000099'
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}', email text,created_at timestamptz default now(),last_sign_in_at timestamptz,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$ select '${uid}'::uuid $$;
      grant usage on schema auth,public to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`)
    for(const file of ['202610230001_accounts.sql','202610230002_function_permissions.sql','20261024121053_learning_attempts.sql']) await db.exec(await readFile(`supabase/migrations/${file}`,'utf8'))
    await db.query('insert into auth.users(id) values($1)',[uid]); await db.exec('set role authenticated')
    await page.route('**/api/progress', route=>route.fulfill({json:{state:{...EMPTY_ACADEMY,name:'Test researcher',storyStep:3}}}))
    let lostResponse=true
    const buyOperations:string[]=[]
    await page.route('**/api/learning*',async route=>{
      const req=route.request(), url=new URL(req.url())
      try {
        if(req.method()==='POST') {
          const p=req.postDataJSON()
          const r=await db.query<{attempt:unknown}>('select learning_act($1,$2,$3,$4,$5,$6) as attempt',[p.operationId,p.courseId,p.attemptId,p.revision,p.action,p.reason])
          if(p.action==='buy_40') { buyOperations.push(p.operationId); if(lostResponse) { lostResponse=false; return route.fulfill({status:503,json:{error:'Test: response lost after database commit'}}) } }
          return route.fulfill({json:{attempt:r.rows[0].attempt,saved:true}})
        }
        if(url.searchParams.has('attempt')) {
          const a=(await db.query<{id:string;course_id:string;script_version:string}>('select * from learning_attempts where id=$1',[url.searchParams.get('attempt')])).rows[0]
          const content=(await db.query<{content:unknown}>('select content from learning_content where course_id=$1 and script_version=$2',[a.course_id,a.script_version])).rows[0].content
          const choices=(await db.query('select * from learning_choices where attempt_id=$1 order by created_at',[a.id])).rows
          return route.fulfill({json:{attempt:a,content,choices}})
        }
        const courses=(await db.query('select *,true as allowed from learning_courses')).rows
        const attempts=(await db.query('select * from learning_attempts order by started_at desc')).rows
        return route.fulfill({json:{courses,attempts,entitlements:[]}})
      } catch(e) { return route.fulfill({status:409,json:{error:(e as Error).message}}) }
    })
    const enter=async()=>{
      await page.goto('/dashboard'); await page.locator('.night-entry-card--academy').click()
      await page.getByRole('button',{name:'案例实践',exact:true}).click()
    }
    await enter()
    await page.getByRole('button',{name:'开始学习',exact:true}).click()
    await page.locator('[data-choice="research"]').click()
    await page.locator('[data-choice="buy_40"]').click()
    await expect(page.locator('.academy-simulation-dialogue').getByRole('alert')).toContainText('response lost')
    await expect(page.getByText('已保存到你的账号',{exact:true})).toHaveCount(0)
    await page.getByRole('button',{name:'重试保存或加载'}).click()
    await expect(page.getByTestId('account-total')).toHaveText('9,180.00')
    expect(buyOperations.length).toBe(2); expect(buyOperations[0]).toBe(buyOperations[1])
    await enter()
    await expect(page.getByTestId('account-total')).toHaveText('9,180.00')
    await expect(page.getByRole('progressbar',{name:'场景进度'})).toHaveAttribute('aria-valuenow','2')
    await expect(page.locator('.academy-simulation-stage')).toBeVisible()
    await expect(page.locator('.academy-case-notes .done')).toHaveCount(3)
    await page.getByText('本次选择记录',{exact:true}).click()
    await expect(page.locator('.academy-simulation-dialogue details li')).toHaveCount(2)
    await page.getByText('本次选择记录',{exact:true}).click()
    await mkdir('docs/collab/learning-validation',{recursive:true})
    await page.screenshot({path:'docs/collab/learning-validation/scene-03-zh.png',fullPage:true})
    await page.locator('[data-choice="hold_rules"]').click()
    await expect(page.getByTestId('account-total')).toHaveText('13,760.00')
    await page.getByLabel('复盘',{exact:true}).fill('基本面恶化时重新评估退出条件，不以一次盈利证明方法有效。')
    await page.getByRole('button',{name:'完成本次模拟复盘'}).click()
    await expect(page.getByText('复盘已保存，本次尝试已完成。')).toBeVisible()
    await expect(page.locator('.academy-case-notes .done')).toHaveCount(4)
    await page.getByRole('button',{name:'切换为英文',exact:true}).click()
    await expect(page.getByText('Review saved. This attempt is complete.')).toBeVisible()
    await page.screenshot({path:'docs/collab/learning-validation/completed-en.png',fullPage:true})
    const oldId=(await db.query<{id:string}>('select id from learning_attempts')).rows[0].id
    await page.getByRole('button',{name:'Reset simulation',exact:true}).click()
    await page.locator('[data-choice="research"]').click()
    await page.locator('[data-choice="buy_40"]').click()
    await page.locator('[data-choice="sell_fear"]').click()
    await expect(page.getByTestId('account-total')).toHaveText('9,180.00')
    await expect(page.getByText('-820.00',{exact:true})).toBeVisible()
    const rows=(await db.query<{id:string;status:string;shares:number;realized_cents:number}>('select * from learning_attempts order by started_at')).rows
    expect(rows.length).toBe(2); expect(rows[0].status).toBe('completed'); expect(rows[1].shares).toBe(0); expect(Number(rows[1].realized_cents)).toBe(-82000)
    await page.getByLabel('Attempt history',{exact:true}).selectOption(oldId)
    await expect(page.getByTestId('account-total')).toHaveText('13,760.00')
  } finally { await db.close() }
})
