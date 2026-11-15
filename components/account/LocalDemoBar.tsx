'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/lib/i18n'
type State={ready:boolean;mode:'online'|'offline';modelConfigured:boolean;snapshotEnd:string}
export function LocalDemoBar() {
  const [state,setState]=useState<State|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const {lang}=useLang()
  const local=process.env.NEXT_PUBLIC_LOCAL_DEMO==='1'
  useEffect(()=>{if(local) fetch('/api/local/status').then(r=>r.json()).then(setState).catch(()=>setError('Local service unavailable'))},[local])
  if(!local) return null
  return <div style={{position:'fixed',top:0,left:0,right:0,height:42,overflowX:'auto',whiteSpace:'nowrap',zIndex:100000,background:'#12302a',color:'#d9fff0',fontSize:12,padding:'7px 14px',display:'flex',gap:12,alignItems:'center',justifyContent:'center'}} role="status">
    <strong>{lang==='en'?'LOCAL DEMO':'本地演示'} · {state?.mode==='online'?'DeepSeek API':lang==='en'?'Offline presets · not live AI':'离线预设 · 非实时 AI'}</strong>
    <span>{lang==='en'?`Historical closes to ${state?.snapshotEnd||'…'} · local accounts`:`历史收盘快照截至 ${state?.snapshotEnd||'…'} · 账号保存在本机`}</span>
    <button disabled={busy||!state?.ready} style={{border:'1px solid #8fb',padding:'2px 8px',borderRadius:4}} onClick={async()=>{
      setBusy(true);setError('')
      try {const r=await fetch('/api/local/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:state?.mode==='online'?'offline':'online'})});const s=await r.json();if(!r.ok) throw new Error(s.error);setState(s)}catch(e){setError((e as Error).message)}finally{setBusy(false)}
    }}>{state?.mode==='online'?(lang==='en'?'Switch to offline':'切换离线演示'):(lang==='en'?'Switch to DeepSeek':'切换在线 DeepSeek')}</button>
    {error&&<span>{error}</span>}
  </div>
}
