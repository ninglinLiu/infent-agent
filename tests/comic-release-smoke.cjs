// Read-only production verification. Visual-only Auth/data fixture stays in Playwright;
// unauthenticated real API checks are performed separately by release-smoke.cjs.
const { chromium, expect } = require('@playwright/test')
const { readFileSync, writeFileSync, mkdirSync } = require('node:fs')
const { createHash } = require('node:crypto')
const { spawnSync } = require('node:child_process')
const assert = require('node:assert/strict')

;(async()=>{
  const base='https://omniaihello.com'
  const basic=spawnSync(process.execPath,['tests/release-smoke.cjs',base],{stdio:'inherit'})
  assert.equal(basic.status,0,'Real production entry/API smoke failed')
  const browser=await chromium.launch({channel:'msedge'})
  const context=await browser.newContext({baseURL:base,viewport:{width:1600,height:1200}})
  const page=await context.newPage(), errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  try {
    const asset=await context.request.get('/collab/comic/mentor-atlas.webp')
    assert.equal(asset.status(),200)
    assert.ok(asset.headers()['content-type'].includes('image/webp'))
    const hash=createHash('sha256').update(await asset.body()).digest('hex')
    assert.equal(hash,'111eaa478dc530d3830b8f0f74254ab42b3689d40887c425a54e7999000f5642')
    const uid='00000000-0000-4000-8000-000000000099', attemptId='00000000-0000-4000-8000-000000000098'
    const user={id:uid,aud:'authenticated',role:'authenticated',email:'visual-probe@example.invalid',app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}
    const exp=Math.floor(Date.now()/1000)+3600, encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url')
    const session={access_token:`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:uid,exp,aud:'authenticated',role:'authenticated'})}.ui-test-only`,refresh_token:'ui-test-only',token_type:'bearer',expires_at:exp,expires_in:3600,user}
    await context.addCookies([{name:'sb-bofqqjgdkubmjdnpalqq-auth-token',value:`base64-${encode(session)}`,domain:'omniaihello.com',path:'/',sameSite:'Lax',secure:true}])
    await page.route('**/auth/v1/user',route=>route.fulfill({json:user}))
    await page.route('**/api/profile',route=>route.fulfill({json:{profile:{id:uid,display_name:'Visual probe'},email:user.email}}))
    await page.route('**/api/progress',route=>route.fulfill({json:{state:{name:'Visual probe',storyStep:3,lessonStep:6,simulationStep:0,reducedMotion:false,presentation:'immersive'}}}))
    const attempt={id:attemptId,user_id:uid,course_id:'coca-cola',script_version:'v1',scene:3,status:'active',revision:2,cash_cents:600000,shares:40,cost_cents:400000,price_cents:7950,realized_cents:0,total_cents:918000,unrealized_cents:-82000,notes:['moat','valuation','position'],review:null,started_at:'2026-10-28T00:00:00Z',updated_at:'2026-10-28T00:00:00Z',completed_at:null,parent_id:null}
    const content=JSON.parse(readFileSync('content/courses/coca-cola-v1.json','utf8'))
    await page.route('**/api/learning*',route=>{
      assert.equal(route.request().method(),'GET','Visual probe must never mutate learning data')
      return route.fulfill({json:new URL(route.request().url()).searchParams.has('attempt')?{attempt,content,choices:[]}:{courses:[],attempts:[attempt],entitlements:[]}})
    })
    await page.goto('/dashboard')
    await expect(page.locator('.night-study')).toHaveAttribute('data-scene-ready','true',{timeout:45000})
    await page.locator('.night-entry-card--academy').click()
    await page.getByRole('button',{name:'案例实践',exact:true}).click()
    await expect(page.getByTestId('account-total')).toHaveText('9,180.00')
    await expect(page.locator('.comic-mentor-art--2')).toBeVisible()
    await page.getByRole('button',{name:'重播',exact:true}).click()
    await expect.poll(async()=>Number(await page.locator('.comic-stage').getAttribute('data-frame'))).toBeGreaterThan(0)
    await page.getByRole('button',{name:'到决策点',exact:true}).click()
    await expect(page.getByTestId('replay-price')).toHaveText('79.50')
    await page.locator('.academy-main').evaluate(el=>el.scrollTo(0,0))
    assert.deepEqual(errors,[])
    mkdirSync('docs/collab/comic-simulation',{recursive:true})
    await page.screenshot({path:'docs/collab/comic-simulation/production-visual.png',fullPage:true})
    const report={checkedAt:new Date().toISOString(),url:base,readOnly:true,realAssetSHA256:hash,productionUIWithBrowserOnlyFixture:true,realProductionUserLoginTested:false,animatedCandles:true,browserErrors:0,passed:true}
    writeFileSync('docs/collab/comic-simulation/production-smoke.json',JSON.stringify(report,null,2))
    console.log(JSON.stringify(report))
  } finally { await browser.close() }
})().catch(error=>{console.error(error.message);process.exitCode=1})
