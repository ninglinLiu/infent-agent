'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'

// Fixed teaching paths, not historical candles, forecasts or live market data.
const paths = [[91,94,92,96,95,98,97,100],[98,102,99,103,100,101,99,100],[100,99,96,97,93,94,88,90,86,84,85,79.5],[79.5,88,92,87,103,112,108,128,137,132,156,168,180,194]]
const captions = [
  ['先看公司，别急着看涨跌。','Study the business before its price.'],
  ['留点现金，别一把梭。','Keep cash. Follow your position limit.'],
  ['等等，先复核当初的判断。','Wait. Recheck the original thesis.'],
  ['赚了也要复盘。','Review the win, too.'],
]
export function ComicStage({ scene, lang, stopped, reduced }: { scene: number; lang: 'zh' | 'en'; stopped: boolean; reduced: boolean }) {
  const index = Math.max(0, Math.min(3, scene - 1))
  const [frame,setFrame] = useState(0)
  const [playing,setPlaying] = useState(!reduced && !stopped)
  const [run,setRun] = useState(0)
  const candles = useMemo(() => {
    const anchors=paths[index]
    return Array.from({length:36},(_,i)=>{
      const at=i/35*(anchors.length-1), base=Math.floor(at), fraction=at-base
      const close=anchors[base]+((anchors[base+1]??anchors[base])-anchors[base])*fraction
      const prior=i===0?close-1:(()=>{const p=(i-1)/35*(anchors.length-1),b=Math.floor(p);return anchors[b]+((anchors[b+1]??anchors[b])-anchors[b])*(p-b)})()
      return {open:prior,close,high:Math.max(prior,close)+1.3+(i%3)*.45,low:Math.min(prior,close)-1.2,volume:14+(i*19%51)+(index===2?i:0)}
    })
  },[index])
  useEffect(()=>{setFrame(reduced||stopped?35:0);setPlaying(!reduced&&!stopped)},[index,run,reduced,stopped])
  useEffect(()=>{
    if(!playing) return
    if(frame>=35){setPlaying(false);return}
    const id=window.setTimeout(()=>setFrame(f=>Math.min(35,f+1)),90)
    return ()=>window.clearTimeout(id)
  },[playing,frame])
  const min=Math.floor(Math.min(...candles.map(c=>c.low))/5)*5
  const max=Math.ceil(Math.max(...candles.map(c=>c.high))/5)*5
  const y=(price:number)=>35+(max-price)/(max-min)*205
  const visible=candles.slice(0,frame+1)
  const current=visible[visible.length-1]
  const mean=visible.map((_,i)=>{const group=visible.slice(Math.max(0,i-4),i+1);return `${28+i*12},${y(group.reduce((sum,c)=>sum+c.close,0)/group.length)}`}).join(' ')
  const en=lang==='en'
  return <section className="comic-stage academy-simulation-stage" data-scene={scene} data-frame={frame} data-playing={playing} aria-label={en?'Illustrated teaching replay':'漫画教学回放'}>
    <div className="comic-chart-panel">
      <div className="comic-panel-label"><span>{en?'COCA-COLA / TEACHING REPLAY':'可口可乐 / 教学回放'}</span><span className="comic-replay-state">{playing?(en?'PLAYING':'回放中'):(en?'PAUSED':'已暂停')}</span></div>
      <div className="comic-quote">{index===2?(en?'The price fell. What changed?':'又跌了？！判断依据变了吗？'):index===3?(en?'A result is not proof.':'结果，不等于证明。'):index===1?(en?'Good business. Fair price?':'好公司，也要好价格。'):(en?'Start with the evidence.':'先看证据，再看价格。')}</div>
      <div className="comic-price"><strong data-testid="replay-price">{current.close.toFixed(2)}</strong><span>{en?'simulated credits / share':'模拟币 / 份'}</span></div>
      <svg viewBox="0 0 510 315" className="comic-candles" role="img" aria-label={en?'Animated simulated candlestick replay':'动态教学 K 线回放'}>
        {[0,1,2,3,4].map(i=><g key={i}><line x1="20" x2="465" y1={35+i*51.25} y2={35+i*51.25} className="comic-gridline"/><text x="474" y={39+i*51.25}>{(max-(max-min)*i/4).toFixed(1)}</text></g>)}
        {visible.map((c,i)=><g key={i} className="comic-candle" data-candle={i}>
          <line x1={28+i*12} x2={28+i*12} y1={y(c.high)} y2={y(c.low)} stroke="#24232a" strokeWidth="1.5"/>
          <rect x={24+i*12} y={Math.min(y(c.open),y(c.close))} width="8" height={Math.max(2,Math.abs(y(c.close)-y(c.open)))} fill={c.close>=c.open?'#fbf9f3':'#24232a'} stroke="#24232a" strokeWidth="1.4"/>
          <rect x={24+i*12} y={292-c.volume*.42} width="8" height={c.volume*.42} fill={c.close>=c.open?'#bdb8ca':'#55515f'}/>
        </g>)}
        <polyline points={mean} fill="none" stroke="#a58cd5" strokeWidth="1.7"/>
        <line x1="20" x2="465" y1={y(current.close)} y2={y(current.close)} stroke="#8d70bd" strokeDasharray="4 5"/>
        {index>0&&<g><line x1="20" x2="465" y1={y(100)} y2={y(100)} stroke="#77717d" strokeDasharray="3 6"/><text x="26" y={y(100)-8}>{en?'Entry 100.00':'建仓价 100.00'}</text></g>}
        <text x="24" y="311">{en?'SCENARIO START':'场景开始'}</text><text x="356" y="311">{en?'DECISION POINT':'决策节点'}</text>
      </svg>
      <div className="comic-chart-controls">
        <button type="button" onClick={()=>{if(frame===35)setRun(n=>n+1);else setPlaying(p=>!p)}} aria-label={playing?(en?'Pause replay':'暂停回放'):(en?'Play replay':'播放回放')}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?(en?'Pause':'暂停'):(en?'Play':'播放')}</button>
        <button type="button" onClick={()=>setRun(n=>n+1)}><RotateCcw size={14}/>{en?'Replay':'重播'}</button>
        <button type="button" onClick={()=>{setFrame(35);setPlaying(false)}}><SkipForward size={14}/>{en?'Decision':'到决策点'}</button>
        <small>{en?'Illustrative path, not historical market data':'教学路径 · 非历史行情回放'}</small>
      </div>
    </div>
    <div className="comic-person-panel" key={index}>
      <div className={`comic-mentor-art comic-mentor-art--${index}`} role="img" aria-label={en?`Lin Che, illustrated mentor, scene ${scene}`:`卡通导师林澈，场景 ${scene}`} />
      <span className="comic-ink-label">LIN CHE / {en?'RESEARCHER':'研究员'}</span>
      <div className="comic-speech">{captions[index][en?1:0]}</div>
      {index===2&&<span className="comic-shock" aria-hidden="true">?!</span>}
    </div>
  </section>
}

export function ComicDialogue({ text, reduced, label }: { text: string; reduced: boolean; label: string }) {
  const [length,setLength]=useState(reduced?text.length:0)
  useEffect(()=>{
    setLength(reduced?text.length:0)
    if(reduced)return
    let shown=0
    const timer=window.setInterval(()=>{shown=Math.min(text.length,shown+2);setLength(shown);if(shown===text.length)window.clearInterval(timer)},25)
    return ()=>window.clearInterval(timer)
  },[text,reduced])
  return <blockquote className="comic-dialogue" aria-label={text}><p>{text.slice(0,length)}<span className="comic-type-cursor" aria-hidden="true">{length<text.length?'▌':''}</span></p>{length<text.length&&<button type="button" onClick={()=>setLength(text.length)}>{label}</button>}</blockquote>
}
