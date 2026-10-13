"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import { MeshReflectorMaterial } from '@react-three/drei/core/MeshReflectorMaterial'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type { NightDestination } from './night-navigation'

type V3 = [number, number, number]
type Props = { onOpen: (view: NightDestination) => void; still: boolean; active: boolean; onReady: () => void; onFailure: () => void; reset: number; focus: NightDestination | null }
const PINK = '#ff58ad', CYAN = '#4fe4e7', AMBER = '#ffc078'

function Box({ p, s, color = '#273140', glow, rotation, metal = .25 }: { p: V3; s: V3; color?: string; glow?: string; rotation?: V3; metal?: number }) {
  return <mesh position={p} rotation={rotation} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={color} roughness={.64} metalness={metal} emissive={glow || '#000'} emissiveIntensity={glow ? 1.7 : 0} /></mesh>
}

function Pipe({ from, to, r = .025, color = '#697b8b' }: { from: V3; to: V3; r?: number; color?: string }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a)
  return <mesh position={a.add(b).multiplyScalar(.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())} castShadow><cylinderGeometry args={[r, r, d.length(), 8]} /><meshStandardMaterial color={color} metalness={.65} roughness={.4} /></mesh>
}

function Cable({ points }: { points: V3[] }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v))), 32, .018, 5, false), [points])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry}><meshStandardMaterial color="#111723" /></mesh>
}

function Glow({ p, color, size = 1, rotation = [0, 0, 0] }: { p: V3; color: string; size?: number; rotation?: V3 }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 64
    const x = c.getContext('2d')!; const gradient = x.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,.7)'); gradient.addColorStop(.18, 'rgba(255,255,255,.24)'); gradient.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = gradient; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c)
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh position={p} rotation={rotation}><planeGeometry args={[size * 2, size * 2]} /><meshBasicMaterial map={texture} color={color} transparent opacity={.6} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
}

function Sign({ p, size, title, sub, color = CYAN, vertical = false, rotation = [0, 0, 0], onClick }: { p: V3; size: [number, number]; title: string; sub?: string; color?: string; vertical?: boolean; rotation?: V3; onClick?: () => void }) {
  const [hover, setHover] = useState(false)
  const texture = useMemo(() => {
    const c = document.createElement('canvas'); c.width = vertical ? 256 : 1024; c.height = vertical ? 1024 : 320
    const x = c.getContext('2d')!; x.fillStyle = '#0a1721'; x.fillRect(0, 0, c.width, c.height)
    x.strokeStyle = color; x.lineWidth = 5; x.strokeRect(15, 15, c.width - 30, c.height - 30)
    x.strokeStyle = color + '55'; x.lineWidth = 2; x.strokeRect(27, 27, c.width - 54, c.height - 54)
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = color; x.shadowBlur = 15; x.fillStyle = color
    if (vertical) {
      x.font = '600 150px "Microsoft YaHei", sans-serif'
      const letters = Array.from(title)
      letters.forEach((s, i) => x.fillText(s, c.width / 2, 70 + (i + .5) * (c.height - 140) / letters.length))
    } else {
      x.font = `500 ${title.length > 10 ? 100 : 148}px "Arial", "Microsoft YaHei", sans-serif`
      x.fillText(title, 512, sub ? 131 : 160, 915)
      if (sub) { x.shadowBlur = 4; x.font = '500 31px "Arial", "Microsoft YaHei", sans-serif'; x.fillText(sub, 512, 257, 890) }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }, [title, sub, vertical, color])
  useEffect(() => () => texture.dispose(), [texture])
  const click = (e: ThreeEvent<MouseEvent>) => { if (onClick && e.delta <= 4) { e.stopPropagation(); onClick() } }
  return <group position={p} rotation={rotation}>
    <Box p={[0, 0, -.04]} s={[size[0] + .12, size[1] + .12, .16]} color="#333947" />
    <mesh position={[0, 0, .05]} onClick={click} onPointerOver={e => { if (onClick) { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' } }} onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}>
      <planeGeometry args={size} /><meshBasicMaterial map={texture} color={hover ? [2.1, 2.1, 2.1] : [1.4, 1.4, 1.4]} toneMapped={false} />
    </mesh>
  </group>
}

function Plant({ p, scale = 1 }: { p: V3; scale?: number }) {
  return <group position={p} scale={scale}><mesh position={[0, .2, 0]} castShadow><cylinderGeometry args={[.23, .17, .4, 9]} /><meshStandardMaterial color="#835152" /></mesh>{Array.from({ length: 7 }, (_, i) => <group key={i} rotation={[0, i * 2.4, 0]}><Pipe from={[0, .25, 0]} to={[.15, .75 + i % 3 * .18, 0]} r={.012} color="#557365" /><mesh position={[.15, .75 + i % 3 * .18, 0]} rotation={[.1, 0, -.55]} scale={[.13, .34, .07]} castShadow><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color={i % 2 ? '#567b64' : '#93a478'} roughness={.85} /></mesh></group>)}</group>
}

function Books({ p, count = 12 }: { p: V3; count?: number }) {
  const colors = ['#b29479', '#ba5f70', '#377678', '#caa868', '#677ea5', '#d2c5ad']
  return <group position={p}>{Array.from({ length: count }, (_, i) => <group key={i} position={[i * .12, 0, 0]}><Box p={[0, .15 + i % 3 * .025, 0]} s={[.095, .3 + i % 3 * .05, .24]} color={colors[i % colors.length]} /><Box p={[0, .09, .127]} s={[.072, .018, .01]} color="#d9cbab" /></group>)}</group>
}

function Building({ onOpen }: Pick<Props, 'onOpen'>) {
  return <group>
    {/* A small corner building, open ground floor and occupied upper studio. */}
    <Box p={[0, .06, 0]} s={[6.5, .18, 5]} color="#323541" />
    <Box p={[0, .2, -.2]} s={[4.15, .18, 3.2]} color="#5f626c" />
    <Box p={[0, 1.8, -1.6]} s={[3.7, 3.2, .18]} color="#3b414c" />
    <Box p={[1.85, 1.7, -.25]} s={[.17, 3.1, 2.75]} color="#38404c" />
    <Box p={[-1.85, 1.7, -.5]} s={[.16, 3.1, 2.2]} color="#313943" />
    <Box p={[0, 3.25, -.25]} s={[4, .28, 3.15]} color="#28313e" />
    <Box p={[0, 4.45, -1.48]} s={[3.7, 2.2, .2]} color="#3e4651" />
    <Box p={[1.85, 4.45, -.18]} s={[.2, 2.3, 2.8]} color="#343c4a" />
    <Box p={[-1.82, 4.45, -.18]} s={[.18, 2.3, 2.8]} color="#3e424f" />
    <Box p={[0, 5.65, -.2]} s={[4.12, .22, 3.25]} color="#475160" />
    {/* Cladding and ledges give the facade a human scale. */}
    {[3.6, 3.84, 4.08, 4.32, 4.56, 4.8, 5.04, 5.28].map(y => <Box key={y} p={[1.971, y, -.18]} s={[.023, .013, 2.8]} color="#141f2d" />)}
    <Box p={[0, 3.45, 1.25]} s={[3.82, .18, .2]} color="#576071" />
    <Box p={[0, 5.43, 1.25]} s={[3.82, .19, .2]} color="#4a505c" />
    {[-1.78, -.66, .65, 1.78].map(x => <Box key={x} p={[x, 4.45, 1.24]} s={[.075, 1.86, .15]} color="#252b38" />)}
    <Box p={[0, 4.45, 1.23]} s={[3.5, .055, .15]} color="#293340" />
    <Box p={[0, 4.45, 1.2]} s={[3.5, 1.79, .03]} color="#967771" />
    <Box p={[-.67, 4.65, 1.225]} s={[2.1, 1.25, .01]} color="#dba77f" glow="#865237" />
    <Box p={[1.13, 4.45, 1.235]} s={[.94, 1.77, .012]} color="#35476d" glow="#273e71" />
    {[-.65, .62].map(x => <Box key={x} p={[x, 4.45, 1.29]} s={[.055, 1.8, .08]} color="#262d39" />)}
    <Box p={[0, 4.37, 1.28]} s={[3.55, .055, .08]} color="#33313a" />
    <Box p={[-.58, 3.69, 1.39]} s={[2.24, .1, .44]} color="#39454c" />
    <Books p={[-1.48, 3.72, 1.42]} count={13} />
    <Sign p={[.72, 4.85, 1.36]} size={[1.63, .45]} title="READ / THINK" color={AMBER} onClick={() => onOpen('academy')} />
    {/* Roof clutter: compressor, tank, guard rails, antenna. */}
    <Box p={[-.7, 6, -.25]} s={[1.32, .56, .7]} color="#7b8287" />
    {Array.from({ length: 9 }, (_, i) => <Box key={i} p={[-1.2 + i * .13, 6, .112]} s={[.045, .4, .022]} color="#283944" />)}
    <mesh position={[.94, 6.27, -.8]} castShadow><cylinderGeometry args={[.46, .48, 1.04, 16]} /><meshStandardMaterial color="#48505f" metalness={.65} roughness={.38} /></mesh>
    {[5.81, 6.69].map(y => <mesh key={y} position={[.94, y, -.8]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.48, .025, 6, 24]} /><meshStandardMaterial color="#8c8a9d" metalness={.8} /></mesh>)}
    <Pipe from={[1.65, 5.6, -.4]} to={[1.65, 7.27, -.4]} r={.019} />
    <Pipe from={[1.1, 6.93, -.4]} to={[2.2, 6.93, -.4]} r={.013} />
    <Pipe from={[1.3, 7.1, -.4]} to={[2, 7.1, -.4]} r={.012} />
    <Pipe from={[-1.92, 5.8, -1.55]} to={[-1.92, 6.37, -1.55]} /><Pipe from={[-1.92, 6.37, -1.55]} to={[1.85, 6.37, -1.55]} />
    <Pipe from={[1.85, 5.8, -1.55]} to={[1.85, 6.37, -1.55]} />
    <Box p={[1.987, 3.8, -.6]} s={[.05, 3.2, .065]} color="#788181" />
    <Box p={[2.02, 2.15, -.6]} s={[.16, .45, .4]} color="#797679" />
    {/* Main neon and striped cloth canopy. */}
    <Sign p={[0, 3.14, 1.61]} size={[3.77, .83]} title="omniAI" sub="THE AFTER-HOURS RESEARCH CLUB" color={PINK} onClick={() => onOpen('workspace')} />
    <group position={[0, 2.46, 1.45]} rotation={[.23, 0, 0]}>
      <Box p={[0, 0, 0]} s={[4.25, .09, 1.3]} color="#275966" />
      {Array.from({ length: 11 }, (_, i) => <Box key={i} p={[-1.94 + i * .387, .055, 0]} s={[.18, .018, 1.3]} color="#53727e" />)}
      <Box p={[0, -.13, .65]} s={[4.25, .27, .035]} color="#315868" />
    </group>
    <Pipe from={[-1.77, .3, 1.12]} to={[-1.77, 2.58, 1.12]} r={.035} color="#765565" />
    <Pipe from={[1.77, .3, 1.12]} to={[1.77, 2.58, 1.12]} r={.035} color="#765565" />
    {/* Ground floor studio: shelves, books, light, research desk. */}
    <Box p={[-.63, 1.56, -1.32]} s={[1.99, .075, .47]} color="#795c51" />
    <Box p={[-.63, 2.13, -1.32]} s={[1.99, .075, .47]} color="#795c51" />
    <Books p={[-1.5, 1.6, -1.23]} count={14} /><Books p={[-1.46, 2.17, -1.23]} count={12} />
    <Box p={[-.1, 2.75, -.6]} s={[2.8, .06, .18]} color="#fff2cd" glow="#ffab62" />
    <pointLight position={[-.1, 2.2, .1]} color="#ffb873" intensity={14} distance={5} decay={2} />
    <Box p={[-.4, 1.11, .72]} s={[2.5, .14, .88]} color="#a9826b" />
    <Box p={[-.4, .7, .5]} s={[2.2, .72, .55]} color="#48535b" />
    {Array.from({ length: 12 }, (_, i) => <Box key={i} p={[-1.4 + i * .18, .7, .787]} s={[.075, .69, .022]} color="#6c6c65" />)}
    <Box p={[.45, 1.28, .35]} s={[.42, .06, .3]} color="#292e39" />
    <Box p={[.45, 1.5, .26]} s={[.09, .48, .08]} color="#292e39" />
    <Sign p={[.45, 1.75, .35]} size={[.91, .58]} title="RESEARCH" sub="FOLLOW THE EVIDENCE" color={CYAN} onClick={() => onOpen('workspace')} />
    <Books p={[-1.38, 1.2, .4]} count={5} />
    <mesh position={[-.53, 1.34, .8]} castShadow><cylinderGeometry args={[.1, .08, .24, 16]} /><meshStandardMaterial color="#e9d9c3" /></mesh>
    <mesh position={[-.53, 1.464, .8]}><circleGeometry args={[.08, 16]} /><meshBasicMaterial color="#302421" side={THREE.DoubleSide} /></mesh>
    <Plant p={[-1.35, 1.2, .89]} scale={.38} />
    {[-.98, .18].map(x => <group key={x} position={[x, .29, 1.67]}><mesh position={[0, .57, 0]} castShadow><cylinderGeometry args={[.24, .24, .1, 16]} /><meshStandardMaterial color="#b86278" roughness={.5} /></mesh>{[-.14, .14].flatMap(a => [-.14, .14].map(b => <Pipe key={`${a}/${b}`} from={[a, 0, b]} to={[a * .7, .54, b * .7]} r={.018} color="#b38e78" />))}</group>)}
    {/* Hanging vertical sign and roof lamp. */}
    <Pipe from={[-1.6, 5.8, .75]} to={[-2.55, 5.8, .75]} r={.035} />
    <Pipe from={[-2.4, 5.8, .75]} to={[-2.4, 5.8, 1.68]} r={.035} />
    <Sign p={[-2.4, 4.55, 1.68]} size={[.67, 2.4]} title="学习室" vertical color={CYAN} onClick={() => onOpen('academy')} />
    <Glow p={[-2.4, 4.5, 1.82]} color={CYAN} size={1.1} />
    <pointLight position={[-2.7, 4.4, 1.9]} intensity={17} distance={6} color={CYAN} />
    <Sign p={[2.01, 4.5, -.22]} size={[2.08, .88]} title="STAY CURIOUS" sub="OPEN LATE · THINK LONG" color={AMBER} rotation={[0, Math.PI / 2, 0]} />
    <Plant p={[1.85, .3, 1.3]} scale={1.1} />
    <Plant p={[-1.63, 5.77, .5]} scale={.62} />
  </group>
}

function Street({ onOpen }: Pick<Props, 'onOpen'>) {
  return <group>
    {/* Little research vending machine: each file is an invitation to begin. */}
    <group position={[2.55, .18, .58]} rotation={[0, -.15, 0]}>
      <Box p={[0, 1.03, 0]} s={[1.12, 2.02, .77]} color="#455776" />
      <Box p={[0, 1.1, .398]} s={[.96, 1.61, .026]} color="#132634" />
      <Sign p={[0, 1.92, .43]} size={[1.01, .22]} title="CASE FILES" color={CYAN} onClick={() => onOpen('practice')} />
      {[.72, 1.07, 1.42].flatMap((y, j) => [-.31, -.02, .27].map((x, i) => <group key={`${i}/${j}`}><Box p={[x, y, .433]} s={[.2, .27, .03]} color={['#fdac75', '#77cfcc', '#f093bb'][(i + j) % 3]} glow={['#874224', '#255c64', '#813862'][(i + j) % 3]} /><Box p={[x, y - .04, .454]} s={[.14, .017, .012]} color="#fbf3d9" /></group>))}
      <Box p={[0, .34, .43]} s={[.63, .17, .04]} color="#060e1b" />
      <Box p={[.39, .55, .46]} s={[.08, .055, .05]} color={PINK} glow={PINK} />
      <Glow p={[0, 1.05, .5]} color={CYAN} size={.8} />
    </group>
    <pointLight position={[2.55, 1.3, 1.7]} color={CYAN} intensity={8} distance={4} />
    {/* Utility pole, lantern and electrical wires. */}
    <Pipe from={[-3.1, .1, -.8]} to={[-3.1, 6.6, -.8]} r={.075} color="#44435a" />
    <Pipe from={[-3.1, 5.92, -.8]} to={[-2.8, 5.92, 1.4]} r={.038} />
    <Pipe from={[-2.8, 5.92, 1.4]} to={[-2.8, 5.5, 1.4]} r={.025} />
    <mesh position={[-2.8, 5.22, 1.4]}><sphereGeometry args={[.3, 20, 16]} /><meshStandardMaterial color="#ffd0eb" emissive="#ff58ad" emissiveIntensity={3} toneMapped={false} /></mesh>
    <Glow p={[-2.8, 5.22, 1.75]} color={PINK} size={.8} />
    <pointLight position={[-2.8, 5.1, 1.45]} color={PINK} intensity={17} distance={6} />
    <Cable points={[[-3.1, 6.45, -.8], [-.1, 6.05, -1.9], [3.7, 6.8, -2.3]]} />
    <Cable points={[[-3.1, 6.05, -.8], [-2.4, 4.7, -.6], [-1.9, 4.5, -.35]]} />
    {/* Steps, pavement joints, drain and a bicycle. */}
    <Box p={[0, .05, 2.65]} s={[2.15, .1, .43]} color="#474350" />
    {[-2.1, -1, .1, 1.2, 2.3].map(x => <Box key={x} p={[x, .161, 2.14]} s={[.012, .004, .48]} color="#111e2b" />)}
    <Box p={[1.8, .17, 2.01]} s={[.72, .03, .35]} color="#152435" />
    {Array.from({ length: 9 }, (_, i) => <Box key={i} p={[1.5 + .075 * i, .19, 2.01]} s={[.022, .01, .3]} color="#53546b" />)}
    <group position={[2.65, .52, -1.25]} rotation={[0, .6, 0]}>
      {[-.48, .48].map(x => <mesh key={x} position={[x, 0, 0]}><torusGeometry args={[.34, .028, 8, 28]} /><meshStandardMaterial color="#252d3c" metalness={.5} /></mesh>)}
      <Pipe from={[-.48, 0, 0]} to={[0, .49, 0]} r={.019} color="#b77783" /><Pipe from={[0, .49, 0]} to={[.48, 0, 0]} r={.019} color="#b77783" /><Pipe from={[-.48, 0, 0]} to={[.16, .01, 0]} r={.019} color="#b77783" /><Pipe from={[.16, .01, 0]} to={[.35, .62, 0]} r={.021} color="#b77783" /><Pipe from={[0, .49, 0]} to={[.35, .55, 0]} r={.019} color="#b77783" /><Box p={[0, .53, 0]} s={[.2, .06, .12]} color="#1c2732" />
    </group>
    <Sign p={[1.15, .5, 2.05]} size={[.43, .59]} title="OPEN" sub="ALL NIGHT" color={AMBER} rotation={[-.2, -.18, 0]} />
  </group>
}

function StreetDetails({ still }: { still: boolean }) {
  const tail = useRef<THREE.Group>(null)
  useFrame(({ clock }) => { if (tail.current) tail.current.rotation.z = still ? .15 : .15 + Math.sin(clock.elapsedTime * 1.5) * .13 })
  return <group>
    {/* A small corner of pavement gives the building a place to live. */}
    <Box p={[0, -.09, .15]} s={[9.4, .14, 7.1]} color="#151e2c" metal={.55} />
    {Array.from({ length: 12 }, (_, i) => <Box key={`curb-${i}`} p={[-3.15 + i * .56, .15, 2.48]} s={[.53, .23, .2]} color={i % 3 ? '#727582' : '#5a6373'} />)}
    {Array.from({ length: 6 }, (_, i) => <Box key={`crossing-${i}`} p={[-3.88, -.012, -.9 + i * .43]} s={[1.2, .012, .21]} color="#9295a1" metal={.4} />)}
    {[-2.6, 0, 2.6].map(x => <Box key={x} p={[x, -.011, 3.18]} s={[1.25, .012, .045]} color="#a6a0a1" />)}
    <mesh position={[2.8, -.005, 2.95]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.36, 32]} /><meshStandardMaterial color="#26323f" metalness={.8} roughness={.28} /></mesh>
    {[-.16, 0, .16].map(z => <Box key={z} p={[2.8, .004, 2.95 + z]} s={[.47, .015, .027]} color="#727384" />)}
    {/* A freestanding link belongs to the street, not a floating interface. */}
    <group position={[-2.5, .19, 2.02]} rotation={[0, .18, 0]}>
      <Pipe from={[-.49, 0, 0]} to={[-.49, 1.02, 0]} r={.03} color="#ba9a86" /><Pipe from={[.49, 0, 0]} to={[.49, 1.02, 0]} r={.03} color="#ba9a86" />
      <Box p={[0, .025, 0]} s={[1.3, .055, .48]} color="#353743" />
      <Sign p={[0, .91, .025]} size={[1.28, .58]} title="GitHub ↗" sub="NINGLINLIU / OPEN SOURCE" color="#d3b2ff" onClick={() => window.open('https://github.com/ninglinLiu', '_blank', 'noopener,noreferrer')} />
    </group>
    {/* Umbrella, bench, book crates and a sheltered cat. */}
    <group position={[-2.94, .2, -.43]}>
      <Pipe from={[0, 0, 0]} to={[0, 2.6, 0]} r={.025} color="#aba0a5" />
      <mesh position={[0, 2.38, 0]} rotation={[0, .2, 0]} castShadow><coneGeometry args={[.86, .37, 8]} /><meshStandardMaterial color="#75556f" side={THREE.DoubleSide} roughness={.48} metalness={.15} /></mesh>
      {Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4 + .2; return <Pipe key={i} from={[0, 2.57, 0]} to={[Math.cos(a) * .86, 2.19, Math.sin(a) * .86]} r={.008} color="#ab839a" /> })}
      <group position={[0, .12, -.43]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, .44, 0]} s={[1.42, .1, .44]} color="#9b735f" />
        <Box p={[0, .8, -.18]} s={[1.42, .33, .09]} color="#966d5d" />
        {[-.5, .5].map(x => <Box key={x} p={[x, .2, 0]} s={[.08, .4, .36]} color="#3d4657" />)}
      </group>
    </group>
    <group position={[-2.44, .2, .93]}>
      <Box p={[0, .22, 0]} s={[.61, .44, .61]} color="#845e48" />
      {[.09, .21, .33].map(y => <Box key={y} p={[0, y, .314]} s={[.65, .065, .03]} color="#ba8865" />)}
      <Books p={[-.23, .46, -.1]} count={3} />
      <group position={[.02, .57, .12]}>
        <mesh scale={[.2, .2, .24]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#c4aa8b" /></mesh>
        <mesh position={[0, .22, .08]} scale={[.16, .145, .15]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#d9c0a0" /></mesh>
        {[-.1, .1].map(x => <mesh key={x} position={[x, .35, .07]} rotation={[0, 0, -x * 2]}><coneGeometry args={[.075, .15, 3]} /><meshStandardMaterial color="#b69380" /></mesh>)}
        {[-.062, .062].map(x => <Box key={x} p={[x, .24, .214]} s={[.047, .014, .01]} color="#352c36" />)}
        <group ref={tail} position={[.16, -.06, -.13]}><Pipe from={[0, 0, 0]} to={[.26, .11, 0]} r={.045} color="#b99777" /><Pipe from={[.26, .11, 0]} to={[.3, .25, .015]} r={.042} color="#d5b699" /></group>
      </group>
    </group>
    {/* Warm bulbs and paper lanterns below the awning. */}
    <Cable points={[[-2.07, 2.47, 2.1], [0, 2.2, 2.17], [2.1, 2.47, 2.1]]} />
    {Array.from({ length: 9 }, (_, i) => { const x = -1.95 + i * .49; return <mesh key={i} position={[x, 2.2 + Math.pow(x / 2, 2) * .25 - .075, 2.15]}><sphereGeometry args={[.035, 8, 6]} /><meshBasicMaterial color={[3, 1.4, .6]} toneMapped={false} /></mesh> })}
    {[-1.55, 1.55].map(x => <group key={x} position={[x, 1.95, 1.8]}><Pipe from={[0, .07, 0]} to={[0, .42, 0]} r={.014} /><mesh scale={[.12, .2, .12]}><sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#ffb287" emissive="#ff714e" emissiveIntensity={1.4} /></mesh><Box p={[0, .19, 0]} s={[.13, .03, .12]} color="#675454" /><Box p={[0, -.19, 0]} s={[.13, .03, .12]} color="#675454" /></group>)}
    {/* Side wall machinery and rear details reward a full orbit. */}
    <group position={[2.19, 3.25, -.64]}>
      <Box p={[0, 0, 0]} s={[.47, .7, 1.04]} color="#777d88" />
      <mesh position={[.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.245, .03, 8, 24]} /><meshStandardMaterial color="#343b4a" metalness={.7} /></mesh>
      {[-.12, 0, .12].map(y => <Box key={y} p={[.257, y, 0]} s={[.017, .025, .41]} color="#394454" />)}
      <Cable points={[[.16, -.32, .33], [.19, -.74, .33], [-.12, -.99, .42]]} />
    </group>
    <group position={[0, 0, -1.73]}>
      <Box p={[.2, 4.35, 0]} s={[1.8, 1.19, .08]} color="#263445" />
      <Box p={[.2, 4.35, -.045]} s={[1.64, 1.03, .014]} color="#c8a16e" glow="#765633" />
      <Box p={[.2, 4.35, -.072]} s={[.055, 1.08, .04]} color="#46516a" />
      <Box p={[.2, 4.35, -.072]} s={[1.7, .06, .04]} color="#46516a" />
      <Box p={[-.43, 1.1, -.03]} s={[1.28, 2.1, .07]} color="#405464" />
      <Box p={[-.89, 1.1, -.085]} s={[.06, .19, .04]} color="#cfb390" />
      <Sign p={[.85, 1.67, -.12]} size={[.72, .48]} title="夜读" sub="READ / MAKE / REPEAT" rotation={[0, Math.PI, 0]} color={AMBER} />
      <Pipe from={[-1.52, .3, -.16]} to={[-1.52, 5.9, -.16]} r={.027} /><Pipe from={[-.99, .3, -.16]} to={[-.99, 5.9, -.16]} r={.027} />
      {Array.from({ length: 15 }, (_, i) => <Pipe key={i} from={[-1.52, .46 + i * .36, -.16]} to={[-.99, .46 + i * .36, -.16]} r={.019} />)}
    </group>
    <Plant p={[2.8, .2, -1.85]} scale={1.08} />
    <Box p={[2.97, .32, -.64]} s={[.45, .47, .47]} color="#927664" />
    <Box p={[2.97, .57, -.64]} s={[.45, .035, .12]} color="#cab59c" />
    <group position={[3.78, .04, 1.7]}><Box p={[0, .025, 0]} s={[.4, .06, .4]} color="#55525a" /><mesh position={[0, .3, 0]}><coneGeometry args={[.17, .55, 8]} /><meshStandardMaterial color="#c77850" /></mesh><mesh position={[0, .31, 0]}><cylinderGeometry args={[.075, .107, .1, 8]} /><meshStandardMaterial color="#e2d4bd" /></mesh></group>
  </group>
}

function Rain({ still }: { still: boolean }) {
  const ref = useRef<THREE.LineSegments>(null)
  const positions = useMemo(() => {
    const result = new Float32Array(320 * 6)
    for (let i = 0; i < 320; i++) { const x = Math.sin(i * 127.1) * 6, y = ((i * .137) % 1) * 10, z = Math.cos(i * 311.7) * 5; result.set([x, y, z, x - .035, y + .19, z], i * 6) }
    return result
  }, [])
  useFrame((_, delta) => {
    if (still || !ref.current) return
    const a = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < a.length; i += 6) { a[i + 1] -= Math.min(delta, .05) * 6.8; if (a[i + 1] < .1) a[i + 1] = 10; a[i + 4] = a[i + 1] + .19 }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return <lineSegments ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><lineBasicMaterial color="#a7c9ed" transparent opacity={.23} depthWrite={false} /></lineSegments>
}

function Ripples({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => { group.current?.children.forEach((child, i) => { const t = still ? .4 : (clock.elapsedTime * .65 + i * .13) % 1; child.scale.setScalar(.2 + t * .6); ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - t) * .18 }) })
  return <group ref={group}>{Array.from({ length: 15 }, (_, i) => <mesh key={i} position={[Math.sin(i * 12.78) * 4.5, .014, 2.7 + Math.cos(i * 6.1) * 1.7]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.28, .288, 32]} /><meshBasicMaterial color={i % 2 ? CYAN : PINK} transparent opacity={.13} depthWrite={false} /></mesh>)}</group>
}

function CameraRig({ reset, focus, still }: { reset: number; focus: NightDestination | null; still: boolean }) {
  const { camera, size } = useThree()
  const controls = useRef<React.ElementRef<typeof OrbitControls>>(null)
  const goal = useRef(new THREE.Vector3())
  const target = useRef(new THREE.Vector3())
  useEffect(() => {
    camera.position.set(9.8, 7.1, 16)
    camera.lookAt(0, 3, 0)
    controls.current?.target.set(0, 3, 0); controls.current?.update()
  }, [camera, size.width, size.height, reset])
  useFrame((_, delta) => {
    if (!focus || !controls.current) return
    if (focus === 'academy') { goal.current.set(4.4, 5.8, 10); target.current.set(-.2, 3.5, .9) }
    else if (focus === 'practice') { goal.current.set(6.7, 3.6, 7.4); target.current.set(2.1, 1.45, .8) }
    else { goal.current.set(4.6, 3.4, 8.6); target.current.set(0, 1.65, .5) }
    const k = still ? 1 : 1 - Math.exp(-4 * Math.min(delta, .05))
    camera.position.lerp(goal.current, k); controls.current.target.lerp(target.current, k); controls.current.update()
  })
  return <OrbitControls ref={controls} enabled={!focus} target={[0, 3, 0]} enablePan={false} enableZoom minDistance={9.5} maxDistance={32} minPolarAngle={.25} maxPolarAngle={Math.PI / 2 - .05} rotateSpeed={.65} zoomSpeed={.85} enableDamping dampingFactor={.065} />
}

function NeonBloom() {
  const { gl, scene, camera, size } = useThree()
  const composer = useRef<EffectComposer | null>(null)
  useEffect(() => {
    const pipeline = new EffectComposer(gl)
    const bloom = new UnrealBloomPass(new THREE.Vector2(1024, 768), .44, .5, 1)
    const render = new RenderPass(scene, camera), output = new OutputPass()
    pipeline.addPass(render); pipeline.addPass(bloom); pipeline.addPass(output)
    composer.current = pipeline
    return () => { composer.current = null; pipeline.dispose(); bloom.dispose(); output.dispose() }
  }, [gl, scene, camera])
  useEffect(() => { composer.current?.setSize(size.width, size.height) }, [size.width, size.height])
  useFrame(() => { if (composer.current) composer.current.render(); else gl.render(scene, camera) }, 1)
  return null
}

function FrameBudget({ onSlow, active }: { onSlow: () => void; active: boolean }) {
  const sample = useRef({ frames: 0, elapsed: 0, checked: false })
  useEffect(() => { sample.current = { frames: 0, elapsed: 0, checked: false } }, [active])
  useFrame((_, delta) => {
    const s = sample.current
    if (!active || s.checked) return
    s.frames++
    if (s.frames > 45) s.elapsed += Math.min(delta, .15)
    if (s.frames === 195) { s.checked = true; if (s.elapsed > 5.5) onSlow() }
  })
  return null
}

function Hologram({ still }: { still: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const points = useMemo(() => {
    const p: number[] = []
    for (let i = 0; i < 180; i++) { const a = i / 180 * Math.PI * 2; p.push(Math.cos(a) * .65, 0, Math.sin(a) * .65) }
    for (let bar = 0; bar < 5; bar++) for (let j = 0; j < 45; j++) { const height = [.22, .39, .33, .59, .8][bar]; p.push(-.42 + bar * .21 + Math.sin(j * 3) * .06, j / 45 * height, Math.cos(j * 3) * .06) }
    return new Float32Array(p)
  }, [])
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = still ? -.3 : Math.sin(clock.elapsedTime * .24) * .4 - .3 })
  return <group position={[-.24, 6.02, .78]} ref={ref}><points><bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry><pointsMaterial color="#5cf2e5" size={.022} transparent opacity={.78} toneMapped={false} depthWrite={false} /></points><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.035, 0]}><cylinderGeometry args={[.12, .18, .09, 16]} /><meshStandardMaterial color="#555c68" /></mesh></group>
}

function Lifecycle({ onReady, onFailure }: Pick<Props, 'onReady' | 'onFailure'>) {
  const { gl } = useThree()
  useEffect(() => { onReady(); const canvas = gl.domElement; canvas.addEventListener('webglcontextlost', onFailure); return () => canvas.removeEventListener('webglcontextlost', onFailure) }, [gl, onReady, onFailure])
  return null
}

export default function NightWorld(props: Props) {
  const [low, setLow] = useState(false)
  const onSlow = useCallback(() => setLow(true), [])
  return <Canvas shadows={!low} dpr={low ? 1 : [1, 1.5]} camera={{ position: [11, 7.7, 17.8], fov: 35 }} frameloop={props.active ? props.still ? 'demand' : 'always' : 'never'} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15 }}>
    <color attach="background" args={['#070b16']} /><fog attach="fog" args={['#070b16', 26, 55]} />
    <ambientLight intensity={.8} color="#9d9bc4" /><hemisphereLight args={['#8497ce', '#212038', .7]} />
    <directionalLight position={[-4, 10, 4]} intensity={2.2} color="#9bade0" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={10} shadow-camera-bottom={-8} shadow-normalBias={.025} />
    <pointLight position={[1, 3.1, 2.3]} color={PINK} intensity={25} distance={7} />
    <pointLight position={[4, 4.5, -1]} color="#766bfe" intensity={24} distance={8} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.045, 0]} receiveShadow><planeGeometry args={[100, 100]} />{low ? <meshStandardMaterial color="#0e1524" metalness={.5} roughness={.6} /> : <MeshReflectorMaterial resolution={512} blur={[300, 100]} mixBlur={1} mixStrength={15} roughness={.9} depthScale={.4} minDepthThreshold={.5} maxDepthThreshold={1.2} color="#171b2b" metalness={.6} mirror={.2} />}</mesh>
    <Building onOpen={props.onOpen} /><Street onOpen={props.onOpen} /><StreetDetails still={props.still} /><Hologram still={props.still} /><Rain still={props.still} /><Ripples still={props.still} /><CameraRig reset={props.reset} focus={props.focus} still={props.still} />{!low && <NeonBloom />}<FrameBudget onSlow={onSlow} active={props.active && !props.still} /><Lifecycle onReady={props.onReady} onFailure={props.onFailure} />
  </Canvas>
}
