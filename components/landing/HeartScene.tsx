'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * 宣传页底层：一颗跟着市场跳动的心脏和它的根须。
 * 全部程序化生成（metaball 心室 + 管道血管 + 递归根须），不依赖任何外部模型或贴图。
 */

type Props = { bpm: number; active: boolean; still: boolean; onReady?: () => void }
type V3 = [number, number, number]

const HEART_Y = -0.54 // 心脏在画布高度约 60% 处（相机 fov 30、距离 10 时可视半高 2.68）

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** 一次心跳的收缩量：「咚」和稍弱的「哒」两个峰 */
export function beatAmount(phase: number) {
  const peak = (x: number) => { const d = ((x % 1) + 1) % 1; const w = Math.min(d, 1 - d); return Math.exp(-((w / 0.045) ** 2)) }
  return peak(phase) + 0.62 * peak(phase - 0.17)
}

function heartTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#7a2622'); grad.addColorStop(.55, '#5a1717'); grad.addColorStop(1, '#3b0d0d')
  g.fillStyle = grad; g.fillRect(0, 0, size, size)
  const r = rng(7)
  // 肌肉的斑驳：大块柔和的明暗
  for (let i = 0; i < 120; i++) {
    const x = r() * size, y = r() * size, rad = 20 + r() * 70
    const blot = g.createRadialGradient(x, y, 0, x, y, rad)
    blot.addColorStop(0, r() < .5 ? 'rgba(20,0,0,.28)' : 'rgba(190,90,70,.18)'); blot.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = blot; g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let i = 0; i < 14000; i++) { g.fillStyle = `rgba(${r() < .5 ? '20,0,0' : '170,70,55'},${r() * .14})`; g.fillRect(r() * size, r() * size, 2, 2) }
  // 表面的细血管：随机游走、逐渐分叉的暗线 + 少量亮线
  const vein = (x: number, y: number, a: number, width: number, depth: number) => {
    g.beginPath(); g.moveTo(x, y)
    const steps = 10 + r() * 22
    for (let s = 0; s < steps; s++) {
      a += (r() - .5) * .6; x += Math.cos(a) * 5; y += Math.sin(a) * 5; g.lineTo(x, y)
      if (depth < 2 && r() < .08) vein(x, y, a + (r() < .5 ? .8 : -.8), width * .6, depth + 1)
    }
    g.lineWidth = width; g.stroke()
  }
  for (let k = 0; k < 46; k++) {
    g.strokeStyle = k % 7 === 0 ? 'rgba(225,140,115,.4)' : 'rgba(22,2,2,.6)'
    vein(r() * size, r() * size, r() * Math.PI * 2, 1.4 + r() * 2.6, 0)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function buildHeart(material: THREE.Material) {
  const effect = new MarchingCubes(54, material, true, false, 90000)
  const subtract = 12, iso = effect.isolation
  const ball = (x: number, y: number, z: number, radius: number) => effect.addBall(x, y, z, radius * radius * (iso + subtract), subtract)
  effect.reset()
  // 左心室：从心尖到心底逐渐变粗，心尖偏左下
  ball(.44, .27, .5, .045); ball(.46, .33, .5, .075); ball(.48, .4, .5, .1); ball(.5, .48, .49, .115); ball(.52, .55, .48, .11)
  // 右心室：偏右前
  ball(.56, .4, .57, .07); ball(.59, .47, .56, .095); ball(.6, .55, .54, .09)
  // 心房与心底
  ball(.43, .62, .45, .075); ball(.64, .61, .5, .085); ball(.54, .6, .47, .08)
  // 左心耳：心底左前方的小凸起，让轮廓不那么像几何体
  ball(.4, .58, .53, .04); ball(.38, .56, .55, .03)
  effect.update()
  // 自带 UV 是从上往下的平面投影，侧面会拉成竖条；改成绕心轴的柱面映射
  const pos = effect.geometry.getAttribute('position'), uv = effect.geometry.getAttribute('uv')
  if (uv) {
    for (let i = 0; i < effect.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
      uv.setXY(i, (Math.atan2(z, x) / (Math.PI * 2) + .5) * 2, y * 1.1)
    }
    uv.needsUpdate = true
  }
  return effect
}

function tube(points: V3[], radius: number, material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)))
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 10, false), material)
}

/**
 * 冠状血管：从外向心轴打射线，取心肌表面上的点连成曲线，再沿法线略微抬起，
 * 这样血管贴着心脏表面走，而不是悬在空中。
 */
function surfaceVessel(heart: THREE.Mesh, path: Array<[number, number]>, radius: number, material: THREE.Material) {
  const ray = new THREE.Raycaster()
  const points: THREE.Vector3[] = []
  for (const [phi, y] of path) {
    const dir = new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi))
    ray.set(dir.clone().multiplyScalar(2).setY(y), dir.clone().negate())
    const hit = ray.intersectObject(heart, false)[0]
    if (hit?.face) points.push(hit.point.clone().addScaledVector(hit.face.normal, radius * .55))
  }
  if (points.length < 3) return null
  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.TubeGeometry(curve, points.length * 6, radius, 6, false)
  // 末端收细
  const pos = geometry.attributes.position, rings = points.length * 6, radial = 6
  for (let k = 0; k < pos.count; k++) {
    const f = Math.floor(k / (radial + 1)) / rings
    const center = curve.getPointAt(Math.min(f, 1))
    const p = new THREE.Vector3().fromBufferAttribute(pos, k).sub(center).multiplyScalar(1 - f * .6).add(center)
    pos.setXYZ(k, p.x, p.y, p.z)
  }
  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, material)
}

/** 沿心表的一条路径（方位角、高度），带一点自然弯曲 */
const line = (phi0: number, phi1: number, y0: number, y1: number, n = 10, wobble = .07, seed = 1): Array<[number, number]> =>
  Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [phi0 + (phi1 - phi0) * t + Math.sin(t * 7 + seed) * wobble * t, y0 + (y1 - y0) * t + Math.cos(t * 5 + seed) * wobble * .3] })

/** 主干加若干侧支：侧支从主干中段出发，斜向下展开 */
function vesselTree(main: [number, number, number, number], branches: number, seed: number): Array<{ path: Array<[number, number]>; radius: number }> {
  const [phi0, phi1, y0, y1] = main
  const r = rng(seed)
  const out = [{ path: line(phi0, phi1, y0, y1, 14, .08, seed), radius: .02 }]
  for (let b = 0; b < branches; b++) {
    const t = .2 + (b + r() * .6) / branches * .7
    const phi = phi0 + (phi1 - phi0) * t, y = y0 + (y1 - y0) * t
    const side = b % 2 ? 1 : -1
    out.push({ path: line(phi, phi + side * (.35 + r() * .3), y, y - .12 - r() * .18, 7, .05, seed + b), radius: .011 - r() * .003 })
  }
  return out
}

function Heart({ bpm, still }: { bpm: number; still: boolean }) {
  const group = useRef<THREE.Group>(null)
  const { meshes, flesh, artery, light } = useMemo(() => {
    const map = heartTexture()
    const flesh = new THREE.MeshPhysicalMaterial({ color: '#c06a60', map, bumpMap: map, bumpScale: 1.2, roughness: .62, clearcoat: .25, clearcoatRoughness: .5, sheen: .7, sheenRoughness: .55, sheenColor: new THREE.Color('#ff9a8a'), emissive: new THREE.Color('#1c0303'), emissiveIntensity: .4 })
    const vessel = new THREE.MeshPhysicalMaterial({ color: '#9a4840', map, bumpMap: map, bumpScale: .8, roughness: .6, clearcoat: .2, emissive: new THREE.Color('#150202') })
    const artery = new THREE.MeshPhysicalMaterial({ color: '#a8463c', roughness: .4, clearcoat: .5, emissive: new THREE.Color('#ff2030'), emissiveIntensity: .1 })
    const vein = new THREE.MeshPhysicalMaterial({ color: '#4c3d5e', roughness: .4, clearcoat: .5, emissive: new THREE.Color('#0a0614') })
    const heart = buildHeart(flesh)
    // 冠状动脉（随心跳微微发光）与回流静脉（偏紫）
    const arteries = [
      ...vesselTree([1.85, 1.55, .2, -.44], 4, 3),   // 前降支
      ...vesselTree([1.95, 3.5, .22, .12], 3, 5),    // 回旋支
      ...vesselTree([1.3, -.4, .16, -.14], 3, 8),    // 右冠状动脉
      ...vesselTree([4.3, 4.55, .16, -.38], 3, 11),  // 后降支
    ]
    const veins = [...vesselTree([1.62, 1.38, .18, -.36], 2, 13), ...vesselTree([3.9, 4.1, .14, -.3], 2, 17)]
    const coronary = [
      ...arteries.map(v => surfaceVessel(heart, v.path, v.radius, artery)),
      ...veins.map(v => surfaceVessel(heart, v.path, v.radius * .85, vein)),
    ].filter((m): m is NonNullable<typeof m> => !!m)
    // 大血管：主动脉弓及分支、肺动脉干、上腔静脉
    const meshes: THREE.Object3D[] = [
      heart,
      tube([[.06, .2, -.02], [.08, .55, 0], [-.04, .78, -.04], [-.22, .72, -.08], [-.32, .45, -.14], [-.33, .05, -.2]], .085, vessel),
      tube([[-.02, .72, -.03], [-.03, .95, -.03], [-.05, 1.12, -.02]], .03, vessel),
      tube([[-.1, .74, -.05], [-.13, .98, -.05], [-.17, 1.15, -.04]], .028, vessel),
      tube([[-.18, .7, -.07], [-.24, .92, -.07], [-.3, 1.08, -.06]], .026, vessel),
      tube([[.2, .16, .14], [.17, .46, .14], [.04, .58, .06], [-.14, .56, .02]], .065, vessel),
      tube([[.17, .46, .14], [.33, .55, .08], [.48, .5, .02]], .05, vessel),
      tube([[.32, .26, .0], [.33, .6, .0], [.35, .98, .0], [.36, 1.14, .0]], .055, vessel),
      tube([[.3, .05, .02], [.38, -.1, .05], [.42, -.22, .02]], .045, vessel),
      ...coronary,
    ]
    const light = new THREE.PointLight('#ff4050', 1, 3.2, 1.6)
    light.position.set(0, -.35, .7)
    return { meshes, flesh, artery, light }
  }, [])
  useEffect(() => () => { meshes.forEach(m => m.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose() } })) }, [meshes])
  useFrame(({ clock }) => {
    const t = still ? 0 : clock.elapsedTime
    const amount = beatAmount(t * bpm / 60)
    const s = 1.5 * (1 - .06 * amount)
    group.current?.scale.set(s * (1 + .02 * amount), s * (1 - .04 * amount), s)
    if (group.current && !still) group.current.rotation.y = -.35 + Math.sin(t * .35) * .12
    flesh.emissiveIntensity = .35 + amount * .7
    artery.emissiveIntensity = .06 + amount * .45
    light.intensity = .8 + amount * 3.2
  })
  return <group ref={group} position={[0, HEART_Y, 0]} rotation={[.12, -.35, -.18]}>
    {meshes.map((m, i) => <primitive key={i} object={m} />)}
    <primitive object={light} />
  </group>
}

const ROOT_VERT = `
attribute float aDist;
varying float vDist;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vDist = aDist;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = -mv.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`
const ROOT_FRAG = `
uniform float uWave;
uniform float uBeat;
varying float vDist;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  float key = max(dot(n, normalize(vec3(-.4, .5, .8))), 0.0);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.2);
  vec3 base = mix(vec3(.24, .06, .055), vec3(.07, .025, .03), smoothstep(0.0, .7, vDist));
  vec3 color = base * (.3 + .8 * key) + vec3(.22, .38, .7) * rim * .35;
  float band = exp(-pow((vDist - uWave) / .04, 2.0)) * (1.0 - vDist * .8);
  float core = pow(1.0 - vDist, 6.0) * uBeat;
  color += vec3(1.0, .14, .2) * (band * .95 + core * .35);
  float alpha = (1.0 - smoothstep(.75, 1.0, vDist)) * .95;
  gl_FragColor = vec4(color, alpha);
}`

/** 递归长出根须；每段带上「离心脏的距离」，着色器用它让脉冲沿根须往外走。 */
function buildRoots() {
  const r = rng(20261102)
  const parts: THREE.BufferGeometry[] = []
  const maxDist = 6.2
  const grow = (start: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, depth: number, dist: number) => {
    const points = [start.clone()]
    const d = dir.clone().normalize()
    const steps = 6
    for (let i = 0; i < steps; i++) {
      d.add(new THREE.Vector3((r() - .5) * .6, (r() - .5) * .45 - .025, (r() - .5) * .3)).normalize()
      points.push(points[points.length - 1].clone().addScaledVector(d, length / steps))
    }
    const curve = new THREE.CatmullRomCurve3(points)
    const tubular = 14, radial = 5
    const geometry = new THREE.TubeGeometry(curve, tubular, radius, radial, false)
    // 根须越往外越细：按长度方向缩小截面
    const pos = geometry.attributes.position
    const dists = new Float32Array(pos.count)
    for (let k = 0; k < pos.count; k++) {
      const i = Math.floor(k / (radial + 1)), f = i / tubular
      const center = curve.getPointAt(Math.min(f, 1))
      const p = new THREE.Vector3().fromBufferAttribute(pos, k)
      p.sub(center).multiplyScalar(1 - f * .55).add(center)
      pos.setXYZ(k, p.x, p.y, p.z)
      dists[k] = Math.min(1, (dist + length * f) / maxDist)
    }
    geometry.setAttribute('aDist', new THREE.BufferAttribute(dists, 1))
    geometry.computeVertexNormals()
    parts.push(geometry)
    if (depth >= 5 || radius < .004) return
    const children = depth === 0 ? 3 : r() < .7 ? 2 : 1
    for (let c = 0; c < children; c++) {
      const at = 2 + Math.floor(r() * (points.length - 3))
      const turn = new THREE.Vector3((r() - .5) * 1.4, (r() - .5) * .9, (r() - .5) * .6)
      grow(points[at], d.clone().add(turn), length * (.6 + r() * .2), radius * .6, depth + 1, dist + length * at / steps)
    }
  }
  // 从心尖和心底向两侧铺开的主根（角度覆盖整个下半圆），外加几条向上攀进结构里的血管
  const apex = new THREE.Vector3(0, HEART_Y - .62, 0)
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * (i + .5) / 14
    const dir = new THREE.Vector3(Math.cos(a) * 1.6, -Math.sin(a) * .7 - .15, (r() - .5) * .5)
    const start = (i % 3 === 0 ? apex.clone().setY(HEART_Y - .2).setX(Math.cos(a) * .35) : apex.clone()).add(new THREE.Vector3(0, 0, (r() - .5) * .2))
    grow(start, dir, 2.1 + r() * 1.4, .038 + r() * .02, 0, 0)
  }
  for (const x of [-.55, -.25, .3, .6]) grow(new THREE.Vector3(x * .5, HEART_Y + .35, -.1), new THREE.Vector3(x * 1.4, 1, -.2), 1.2 + r() * .5, .024, 1, .2)
  return mergeGeometries(parts)
}

function Roots({ bpm, still }: { bpm: number; still: boolean }) {
  const { geometry, material } = useMemo(() => ({
    geometry: buildRoots(),
    material: new THREE.ShaderMaterial({ vertexShader: ROOT_VERT, fragmentShader: ROOT_FRAG, transparent: true, uniforms: { uWave: { value: -1 }, uBeat: { value: 0 } } }),
  }), [])
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useFrame(({ clock }) => {
    const phase = still ? .3 : (clock.elapsedTime * bpm / 60) % 1
    material.uniforms.uWave.value = phase / .85
    material.uniforms.uBeat.value = beatAmount(phase)
  })
  return <mesh geometry={geometry} material={material} />
}

function Rig({ still }: { still: boolean }) {
  const { camera, pointer } = useThree()
  const look = useMemo(() => new THREE.Vector3(0, HEART_Y + .35, 0), [])
  useFrame(({ clock }) => {
    const t = still ? 0 : clock.elapsedTime
    camera.position.x += ((still ? 0 : pointer.x * .5 + Math.sin(t * .12) * .25) - camera.position.x) * .04
    camera.position.y += ((still ? 0 : pointer.y * .25) - camera.position.y) * .04
    camera.lookAt(look)
  })
  return null
}

function Ready({ onReady }: { onReady?: () => void }) {
  useEffect(() => { onReady?.() }, [onReady])
  return null
}

export default function HeartScene({ bpm, active, still, onReady }: Props) {
  return <Canvas camera={{ position: [0, 0, 10], fov: 30, near: .1, far: 60 }} dpr={[1, 1.75]} frameloop={active ? (still ? 'demand' : 'always') : 'never'} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; gl.setClearColor(0x000000, 0) }}>
    <ambientLight intensity={.35} color="#6a7ca0" />
    <directionalLight position={[-3, 2.5, 4]} intensity={2.4} color="#ffd8c8" />
    <directionalLight position={[3, 1.5, -3]} intensity={3.2} color="#7fb0ff" />
    <Heart bpm={bpm} still={still} />
    <Roots bpm={bpm} still={still} />
    <Rig still={still} />
    <Ready onReady={onReady} />
  </Canvas>
}
