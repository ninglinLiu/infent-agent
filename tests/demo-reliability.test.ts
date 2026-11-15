import test from 'node:test'
import assert from 'node:assert/strict'
import { driversInput } from '../lib/ai/tools'
import { completion, ProviderError } from '../lib/ai/provider'
import { localDemoEnabled } from '../lib/local/config'
import { snapshotDaily } from '../lib/local/market'
import { localAnswer } from '../lib/local/answer'

test('the ten-driver request observed five times is normalized to bounded unique work',()=>{
  const parsed=driversInput.parse({symbol:'NVDA',drivers:['TSM','AMD','SOXX','QQQ','SPY','US10Y','VIX','DXY','WTI','GLD']})
  assert.equal(parsed.drivers?.length,8)
  assert.equal(driversInput.safeParse({symbol:'NVDA',drivers:Array(25).fill('SPY')}).success,false)
})
test('provider retries transient errors before streaming and does not retry invalid credentials',async()=>{
  let calls=0
  const options={config:{baseUrl:'https://example.invalid/v1',apiKey:'fixture',model:'fixture'},signal:AbortSignal.timeout(5000),fetcher:async()=>{calls++;return calls===1?new Response('busy',{status:503}):new Response('ok')}}
  assert.equal(await (await completion({},options)).text(),'ok');assert.equal(calls,2)
  calls=0
  await assert.rejects(completion({},{...options,fetcher:async()=>{calls++;return new Response('no',{status:401})}}),(e:unknown)=>e instanceof ProviderError&&e.code==='MODEL_AUTH')
  assert.equal(calls,1)
})
test('local mode fails closed on hosted deployments and uses disclosed real historical snapshots',async()=>{
  process.env.NEXT_PUBLIC_LOCAL_DEMO='1';process.env.OMNIAI_LOCAL_DEMO='1';process.env.VERCEL='1'
  assert.equal(localDemoEnabled(),false)
  delete process.env.VERCEL
  const previousFetch=globalThis.fetch
  globalThis.fetch=async()=>{throw new Error('Network disabled in test')}
  try {
    assert.equal(snapshotDaily('NVDA').dates.at(-1),'2024-12-31')
    assert.throws(()=>snapshotDaily('FAKE'))
    const drafts=await Promise.all(['科技策略','降低回撤','加入黄金'].map(q=>localAnswer(q,'zh')))
    const ids=new Set<string>()
    for(const draft of drafts){assert.match(draft.text,/非实时 AI/);assert.equal(draft.trace.result.ok,true);if(draft.trace.result.ok) ids.add(draft.trace.result.data.strategyId as string)}
    assert.equal(ids.size,3)
  } finally {globalThis.fetch=previousFetch;delete process.env.NEXT_PUBLIC_LOCAL_DEMO;delete process.env.OMNIAI_LOCAL_DEMO}
})
