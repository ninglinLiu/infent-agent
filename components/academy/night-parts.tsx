"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { boardTexture, lanternTexture, softTexture, surfaceTexture, type BoardStyle } from './night-textures'

export type V3 = [number, number, number]
export const PINK = '#ff58ad', CYAN = '#4fe4e7', AMBER = '#ffc078', VERMILION = '#d8452b'

function useSurface(kind: 'tile' | 'pave' | 'wood' | undefined, repeat: [number, number]) {
  const [rx, ry] = repeat
  const map = useMemo(() => {
    if (!kind) return null
    const t = surfaceTexture(kind).clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t
  }, [kind, rx, ry])
  useEffect(() => () => map?.dispose(), [map])
  return map
}

type Interactive = { __r3f?: { handlers?: Record<string, unknown> } }

/** Layer seen by the main camera only; the wet-road reflection camera stays on layer 0. */
export const UNREFLECTED = 1

/** Keeps a subtree out of the reflection pass (backdrops, rain, ripples) to save a second set of draws. */
export function Unreflected({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useLayoutEffect(() => { group.current?.traverse(object => object.layers.set(UNREFLECTED)) })
  return <group ref={group}>{children}</group>
}

/**
 * Merges the static, opaque standard-material meshes below it into one draw call per look, which matters
 * twice over because the wet road renders the scene again. Subtrees marked userData.live and meshes with
 * pointer handlers are left untouched.
 */
export function Bake({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    const root = group.current
    if (!root) return
    root.updateWorldMatrix(true, true)
    const inverse = root.matrixWorld.clone().invert()
    const buckets = new Map<string, { material: THREE.MeshStandardMaterial; parts: THREE.BufferGeometry[]; castShadow: boolean; receiveShadow: boolean }>()
    const hidden: THREE.Mesh[] = []
    const visit = (object: THREE.Object3D) => {
      if (object.userData.live) return
      const mesh = object as THREE.Mesh, material = mesh.material as THREE.MeshStandardMaterial
      const handlers = (object as unknown as Interactive).__r3f?.handlers
      if (mesh.isMesh && !(mesh as THREE.InstancedMesh).isInstancedMesh && mesh.geometry.index && material?.type === 'MeshStandardMaterial' && !material.transparent && !(handlers && Object.keys(handlers).length)) {
        const key = [material.color.getHexString(), material.emissive.getHexString(), material.emissiveIntensity, material.roughness, material.metalness, material.side, material.map?.source.uuid, material.emissiveMap?.source.uuid, mesh.castShadow, mesh.receiveShadow].join('|')
        const part = new THREE.BufferGeometry()
        part.setIndex(mesh.geometry.index.clone())
        for (const name of ['position', 'normal', 'uv']) part.setAttribute(name, mesh.geometry.attributes[name].clone())
        part.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld))
        if (material.map) {
          const uv = part.attributes.uv, { repeat, offset } = material.map
          for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * repeat.x + offset.x, uv.getY(i) * repeat.y + offset.y)
        }
        const bucket = buckets.get(key) ?? { material, parts: [], castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow }
        bucket.parts.push(part); buckets.set(key, bucket); hidden.push(mesh)
      }
      object.children.forEach(visit)
    }
    visit(root)
    const merged: THREE.Mesh[] = []
    buckets.forEach(({ material, parts, castShadow, receiveShadow }) => {
      const geometry = mergeGeometries(parts)
      parts.forEach(part => part.dispose())
      if (!geometry) return
      const look = material.clone()
      if (material.map) { look.map = material.map.clone(); look.map.repeat.set(1, 1); look.map.offset.set(0, 0); look.map.needsUpdate = true }
      if (material.emissiveMap === material.map) look.emissiveMap = look.map
      const mesh = new THREE.Mesh(geometry, look)
      mesh.castShadow = castShadow; mesh.receiveShadow = receiveShadow
      root.add(mesh); merged.push(mesh)
    })
    hidden.forEach(mesh => { mesh.visible = false })
    return () => {
      hidden.forEach(mesh => { mesh.visible = true })
      merged.forEach(mesh => { root.remove(mesh); mesh.geometry.dispose(); const look = mesh.material as THREE.MeshStandardMaterial; look.map?.dispose(); look.dispose() })
    }
  }, [])
  return <group ref={group}>{children}</group>
}

export function Box({ p, s, color = '#273140', glow, rotation, metal = .25, rough = .64, surface, repeat = [1, 1], shadow = true }: { p: V3; s: V3; color?: string; glow?: string; rotation?: V3; metal?: number; rough?: number; surface?: 'tile' | 'pave' | 'wood'; repeat?: [number, number]; shadow?: boolean }) {
  const map = useSurface(surface, repeat)
  return <mesh position={p} rotation={rotation} castShadow={shadow} receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={color} map={map} roughness={rough} metalness={metal} emissive={glow || '#000'} emissiveIntensity={glow ? 1.7 : 0} /></mesh>
}

export function Pipe({ from, to, r = .025, color = '#697b8b' }: { from: V3; to: V3; r?: number; color?: string }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a)
  return <mesh position={a.add(b).multiplyScalar(.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())} castShadow><cylinderGeometry args={[r, r, d.length(), 10]} /><meshStandardMaterial color={color} metalness={.65} roughness={.4} /></mesh>
}

export function Cable({ points, r = .018 }: { points: V3[]; r?: number }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v))), 40, r, 5, false), [points, r])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry}><meshStandardMaterial color="#111723" /></mesh>
}

export function Glow({ p, color, size = 1, rotation = [0, 0, 0], opacity = .6 }: { p: V3; color: string; size?: number; rotation?: V3; opacity?: number }) {
  return <mesh position={p} rotation={rotation}><planeGeometry args={[size * 2, size * 2]} /><meshBasicMaterial map={softTexture()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
}

/** Whole-object navigation; keeps clickable geometry out of the static merge. */
export function SceneLink({ children, onOpen }: { children: React.ReactNode; onOpen: () => void }) {
  return <group userData={{ live: true }}
    onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); if (event.delta <= 4) { document.body.style.cursor = ''; onOpen() } }}
    onPointerOver={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { document.body.style.cursor = '' }}>
    {children}
  </group>
}

type PanelProps = {
  p: V3; size: [number, number]; title: string; sub?: string; lines?: string; color?: string; kind?: BoardStyle; ink?: string; vertical?: boolean; font?: string; ppu?: number
  rotation?: V3; onClick?: () => void; frame?: string | null; depth?: number; back?: boolean
}

/** A physical sign: lit faces ignore scene light, painted and wooden faces receive it. */
export function Panel({ p, size, title, sub, lines, color = CYAN, kind = 'neon', ink, vertical = false, font, ppu, rotation = [0, 0, 0], onClick, frame = '#2d323e', depth = .14, back = false }: PanelProps) {
  const [hover, setHover] = useState(false)
  const [w, h] = size
  const map = useMemo(() => boardTexture({ title, sub, lines, color, style: kind, ink, vertical, font, ppu }, [w, h]), [title, sub, lines, color, kind, ink, vertical, font, ppu, w, h])
  useEffect(() => () => map.dispose(), [map])
  const lit = kind === 'neon' || kind === 'light'
  const click = (e: ThreeEvent<MouseEvent>) => { if (onClick && e.delta <= 4) { e.stopPropagation(); onClick() } }
  const over = (e: ThreeEvent<PointerEvent>) => { if (onClick) { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' } }
  const out = () => { if (onClick) { setHover(false); document.body.style.cursor = '' } }
  const material = lit
    ? <meshBasicMaterial map={map} color={hover ? [1.9, 1.9, 1.9] : kind === 'neon' ? [1.25, 1.25, 1.25] : [.85, .85, .85]} toneMapped={false} />
    : <meshStandardMaterial map={map} roughness={.8} emissive="#ffffff" emissiveMap={map} emissiveIntensity={hover ? .5 : kind === 'paper' ? .3 : .12} />
  return <group position={p} rotation={rotation}>
    {frame && <mesh position={[0, 0, -depth / 2 + .01]} castShadow receiveShadow><boxGeometry args={[w + .08, h + .08, depth]} /><meshStandardMaterial color={frame} metalness={.45} roughness={.5} /></mesh>}
    <mesh position={[0, 0, .016]} onClick={click} onPointerOver={over} onPointerOut={out}><planeGeometry args={size} />{material}</mesh>
    {back && <mesh position={[0, 0, -depth + .004]} rotation={[0, Math.PI, 0]} onClick={click} onPointerOver={over} onPointerOut={out}><planeGeometry args={size} />{material}</mesh>}
  </group>
}

const CHOCHIN = Array.from({ length: 22 }, (_, i) => { const t = i / 21, y = t * 2 - 1; return new THREE.Vector2(Math.max(.18, Math.sqrt(1 - y * y * .86)), y) })
const CHINA = Array.from({ length: 22 }, (_, i) => { const t = i / 21, y = t * 2 - 1; return new THREE.Vector2(Math.max(.42, Math.sqrt(1 - Math.pow(Math.abs(y), 2.4) * .9)), y * .78) })

/** Japanese chōchin (paper or red) and Chinese palace lanterns, swaying gently in the rain. */
export function Lantern({ p, text, kind = 'chochin', scale = 1, still, phase = 0, cord = .3 }: { p: V3; text: string; kind?: 'chochin' | 'red' | 'china'; scale?: number; still: boolean; phase?: number; cord?: number }) {
  const ref = useRef<THREE.Group>(null)
  const map = useMemo(() => lanternTexture(text, kind), [text, kind])
  const geometry = useMemo(() => new THREE.LatheGeometry(kind === 'china' ? CHINA : CHOCHIN, 40, Math.PI), [kind])
  useEffect(() => () => { map.dispose(); geometry.dispose() }, [map, geometry])
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.z = still ? 0 : Math.sin(clock.elapsedTime * 1.1 + phase) * .045 })
  const china = kind === 'china', [rx, ry] = china ? [.2, .2] : [.14, .21]
  const cap = china ? '#e0a43a' : '#1b1715'
  return <group position={p} scale={scale}><group ref={ref} userData={{ live: true }}>
    <mesh position={[0, -cord / 2, 0]}><cylinderGeometry args={[.006, .006, cord, 4]} /><meshStandardMaterial color="#222" /></mesh>
    <group position={[0, -cord - ry, 0]}>
      <mesh geometry={geometry} scale={[rx, ry, rx]}><meshStandardMaterial map={map} emissiveMap={map} emissive={china ? '#ff6a3d' : kind === 'red' ? '#ff5a3a' : '#ffc27a'} emissiveIntensity={china ? 1.5 : 1.35} roughness={.75} /></mesh>
      {[-1, 1].map(s => <mesh key={s} position={[0, s * ry * (china ? .8 : .98), 0]}><cylinderGeometry args={[rx * (china ? .5 : .45), rx * (china ? .5 : .45), ry * .14, 20]} /><meshStandardMaterial color={cap} metalness={china ? .7 : .1} roughness={.4} /></mesh>)}
      {china && <group position={[0, -ry * .9, 0]}>
        <mesh position={[0, -.05, 0]}><cylinderGeometry args={[.018, .018, .06, 8]} /><meshStandardMaterial color="#e0a43a" metalness={.7} /></mesh>
        <mesh position={[0, -.17, 0]}><coneGeometry args={[.05, .2, 10, 1, true]} /><meshStandardMaterial color="#d32228" side={THREE.DoubleSide} emissive="#6a0c0c" /></mesh>
      </group>}
      <Glow p={[0, 0, rx + .02]} color={china ? '#ff5a3a' : kind === 'red' ? '#ff6a4a' : '#ffb26a'} size={rx * 3.2} opacity={.42} />
    </group>
  </group></group>
}

export function Plant({ p, scale = 1 }: { p: V3; scale?: number }) {
  return <group position={p} scale={scale}><mesh position={[0, .2, 0]} castShadow><cylinderGeometry args={[.23, .17, .4, 12]} /><meshStandardMaterial color="#835152" /></mesh>{Array.from({ length: 7 }, (_, i) => <group key={i} rotation={[0, i * 2.4, 0]}><Pipe from={[0, .25, 0]} to={[.15, .75 + i % 3 * .18, 0]} r={.012} color="#557365" /><mesh position={[.15, .75 + i % 3 * .18, 0]} rotation={[.1, 0, -.55]} scale={[.13, .34, .07]} castShadow><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={i % 2 ? '#567b64' : '#93a478'} roughness={.85} /></mesh></group>)}</group>
}

export function Books({ p, count = 12 }: { p: V3; count?: number }) {
  const colors = ['#b29479', '#ba5f70', '#377678', '#caa868', '#677ea5', '#d2c5ad']
  return <group position={p}>{Array.from({ length: count }, (_, i) => <group key={i} position={[i * .12, 0, 0]}><Box p={[0, .15 + i % 3 * .025, 0]} s={[.095, .3 + i % 3 * .05, .24]} color={colors[i % colors.length]} /><Box p={[0, .09, .127]} s={[.072, .018, .01]} color="#d9cbab" shadow={false} /></group>)}</group>
}
