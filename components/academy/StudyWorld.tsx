"use client"

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { MentorId } from '@/lib/academy'

type Vec3 = [number, number, number]
export type WorldInput = { x: number; y: number; scroll: number }
export type StudyWorldProps = {
  mentor: MentorId
  chapter: number
  still: boolean
  active: boolean
  wave: number
  input: React.MutableRefObject<WorldInput>
  onReady: () => void
  onFailure: () => void
}

function Clay({ position = [0, 0, 0], size, color, radius = .08, rotation = [0, 0, 0], emissive }: {
  position?: Vec3; size: Vec3; color: string; radius?: number; rotation?: Vec3; emissive?: string
}) {
  const [width, height, depth] = size
  const geometry = useMemo(() => new RoundedBoxGeometry(width, height, depth, 3, Math.min(radius, width / 2 - .001, height / 2 - .001, depth / 2 - .001)), [width, height, depth, radius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} position={position} rotation={rotation} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={.65} metalness={.02} emissive={emissive || '#000'} emissiveIntensity={emissive ? .8 : 0} />
  </mesh>
}

function Ball({ position, scale = [1, 1, 1], color }: { position: Vec3; scale?: Vec3; color: string }) {
  return <mesh position={position} scale={scale} castShadow><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color={color} roughness={.68} /></mesh>
}

function Ring({ radius, position, color, tube = .025, rotation = [0, 0, 0], glow = false }: {
  radius: number; position: Vec3; color: string; tube?: number; rotation?: Vec3; glow?: boolean
}) {
  return <mesh position={position} rotation={rotation}><torusGeometry args={[radius, tube, 10, 48]} /><meshStandardMaterial color={color} emissive={glow ? color : '#000'} emissiveIntensity={glow ? 2 : 0} roughness={.4} /></mesh>
}

function Character({ mentor, still, wave, input }: Pick<StudyWorldProps, 'mentor' | 'still' | 'wave' | 'input'>) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const hand = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const greetUntil = useRef(0)
  const clock = useThree(s => s.clock)
  const invalidate = useThree(s => s.invalidate)
  const value = mentor === 'value'
  useEffect(() => { if (wave) greetUntil.current = clock.elapsedTime + 2.4; invalidate() }, [wave, clock, invalidate])
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const damping = 1 - Math.exp(-5 * Math.min(delta, .05))
    if (root.current) root.current.position.y = still ? 0 : Math.sin(t * 1.8) * .025
    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, still ? 0 : input.current.x * .22, still ? 1 : damping)
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, still ? 0 : input.current.y * .08, still ? 1 : damping)
    }
    // The arm is on +X; positive Z raises the hand outward instead of across the face.
    if (hand.current) {
      const angle = still ? .12 : t < greetUntil.current ? 2.1 + Math.sin(t * 12) * .2 : .12 + Math.sin(t * 1.5) * .035
      hand.current.rotation.z = THREE.MathUtils.lerp(hand.current.rotation.z, angle, still ? 1 : damping)
    }
    if (eyes.current) eyes.current.scale.y = !still && t % 5.2 > 5.05 ? .12 : 1
  })
  return <group ref={root}>
    <Clay position={[-.28, .18, .15]} size={[.45, .26, .7]} color="#27353b" radius={.1} />
    <Clay position={[.28, .18, .15]} size={[.45, .26, .7]} color="#27353b" radius={.1} />
    <Clay position={[-.27, .64, 0]} size={[.36, .83, .38]} color={value ? '#374b50' : '#354b6d'} radius={.13} />
    <Clay position={[.27, .64, 0]} size={[.36, .83, .38]} color={value ? '#374b50' : '#354b6d'} radius={.13} />
    <Clay position={[0, 1.4, 0]} size={[1.04, 1, .65]} color={value ? '#49625d' : '#274c91'} radius={.2} />
    {value && <><Clay position={[0, 1.61, .345]} size={[.38, .5, .04]} color="#fff5df" radius={.03} /><Clay position={[0, 1.46, .38]} size={[.12, .45, .04]} color="#d99c58" radius={.025} /><Clay position={[-.23, 1.62, .35]} size={[.22, .47, .06]} color="#38544e" rotation={[0, 0, .35]} radius={.025} /><Clay position={[.23, 1.62, .35]} size={[.22, .47, .06]} color="#38544e" rotation={[0, 0, -.35]} radius={.025} /></>}
    <group position={[-.6, 1.75, 0]} rotation={[0, 0, -.1]}><Clay position={[0, -.32, 0]} size={[.32, .63, .34]} color={value ? '#49625d' : '#274c91'} radius={.14} /><Ball position={[0, -.72, 0]} scale={[.17, .24, .18]} color="#edbd94" /></group>
    <group ref={hand} position={[.6, 1.75, 0]}><Clay position={[0, -.32, 0]} size={[.32, .63, .34]} color={value ? '#49625d' : '#274c91'} radius={.14} /><Ball position={[0, -.72, 0]} scale={[.17, .24, .18]} color="#edbd94" /></group>
    <mesh position={[0, 1.94, 0]}><cylinderGeometry args={[.2, .24, .3, 20]} /><meshStandardMaterial color="#e9b98f" /></mesh>
    <group ref={head} position={[0, 2.58, 0]}>
      <Ball position={[0, 0, 0]} scale={[.72, .76, .64]} color="#f0c7a1" />
      <Ball position={[-.69, -.03, 0]} scale={[.14, .21, .14]} color="#eab78d" /><Ball position={[.69, -.03, 0]} scale={[.14, .21, .14]} color="#eab78d" />
      <Ball position={[0, .52, -.1]} scale={[.71, .3, .57]} color={value ? '#e7e3d4' : '#563f37'} />
      <group rotation={[0, 0, -.19]}><Ball position={[-.12, .53, .21]} scale={[.6, .22, .45]} color={value ? '#f6f3e5' : '#765346'} /></group>
      <Ball position={[-.61, .22, -.05]} scale={[.11, .37, .42]} color={value ? '#e7e3d4' : '#563f37'} /><Ball position={[.62, .17, -.12]} scale={[.1, .36, .43]} color={value ? '#e7e3d4' : '#563f37'} />
      <group ref={eyes} position={[0, .04, .56]}>
        {[-.26, .26].map(x => <group key={x} position={[x, 0, 0]}><Ball position={[0, 0, 0]} scale={[.145, .17, .08]} color="#fffaf1" /><Ball position={[.02, 0, .066]} scale={[.081, .105, .042]} color="#383128" /><Ball position={[-.005, .036, .102]} scale={[.027, .033, .012]} color="#ffffff" /></group>)}
      </group>
      <Ball position={[0, -.11, .625]} scale={[.11, .135, .12]} color="#e8b38d" />
      <Ball position={[-.43, -.2, .52]} scale={[.12, .055, .025]} color="#dfa18a" /><Ball position={[.43, -.2, .52]} scale={[.12, .055, .025]} color="#dfa18a" />
      <mesh position={[0, -.27, .584]} rotation={[0, 0, Math.PI]}><torusGeometry args={[.17, .018, 8, 30, Math.PI]} /><meshStandardMaterial color="#906c54" /></mesh>
      <Clay position={[-.26, .27, .57]} size={[.22, .045, .03]} color={value ? '#a2a191' : '#563f37'} rotation={[0, 0, .08]} radius={.015} /><Clay position={[.26, .27, .57]} size={[.22, .045, .03]} color={value ? '#a2a191' : '#563f37'} rotation={[0, 0, -.08]} radius={.015} />
      {value && <><Ring position={[-.27, .025, .665]} radius={.22} tube={.032} color="#425854" /><Ring position={[.27, .025, .665]} radius={.22} tube={.032} color="#425854" /><Clay position={[0, .065, .668]} size={[.13, .045, .04]} color="#425854" radius={.01} /><Clay position={[-.58, .1, .38]} size={[.045, .045, .6]} color="#425854" radius={.01} /><Clay position={[.58, .1, .38]} size={[.045, .045, .6]} color="#425854" radius={.01} /></>}
    </group>
  </group>
}

function Plant({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, .25, 0]} castShadow><cylinderGeometry args={[.29, .22, .5, 28]} /><meshStandardMaterial color="#edede0" /></mesh>
    <mesh position={[0, .48, 0]}><cylinderGeometry args={[.25, .25, .035, 24]} /><meshStandardMaterial color="#756044" /></mesh>
    {[-1, 0, 1, 2].map((i, index) => <group key={i} rotation={[0, index * 1.7, i * .18]} position={[0, .52, 0]}><mesh rotation={[0, 0, .4]} position={[.13, .33, 0]} scale={[.12, .5, .045]} castShadow><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color={index % 2 ? '#98ac51' : '#608354'} /></mesh></group>)}
  </group>
}

function StudyRoom() {
  return <group>
    <Clay position={[0, -.05, 0]} size={[6.5, .16, 4.7]} color="#ecbf6d" radius={.15} />
    <Clay position={[0, .045, 0]} size={[5.95, .035, 4.14]} color="#f3da9e" radius={.1} />
    <Clay position={[.25, 2.25, -1.95]} size={[6.5, 4.6, .15]} color="#f2e8d7" radius={.15} />
    <Clay position={[.4, 1.4, -.76]} size={[3.6, .18, 1.35]} color="#fffbec" radius={.12} />
    {[-1.14, 1.94].flatMap(x => [-1.2, -.3].map(z => <Clay key={`${x}-${z}`} position={[x, .72, z]} size={[.14, 1.3, .14]} color="#c3965d" radius={.035} />))}
    <group position={[.74, 1.53, -1.12]}>
      <Clay position={[0, .13, 0]} size={[.6, .09, .37]} color="#4a535b" radius={.04} />
      <Clay position={[0, .34, -.06]} size={[.13, .47, .12]} color="#4a535b" radius={.03} />
      <Clay position={[0, .82, -.04]} size={[1.4, .91, .12]} color="#4a535b" radius={.075} />
      <Clay position={[0, .83, .03]} size={[1.24, .75, .025]} color="#183b46" radius={.035} />
      {[.17, .29, .23, .4, .5, .57].map((h, i) => <Clay key={i} position={[-.47 + i * .185, .51 + h / 2, .057]} size={[.09, h, .017]} color={i % 2 ? '#e8bd66' : '#89c5b9'} radius={.015} />)}
    </group>
    <Clay position={[.6, 1.54, -.3]} size={[1, .055, .32]} color="#c8d7d5" radius={.035} />
    <group position={[-.9, 1.53, -.65]}><mesh position={[0, .13, 0]} castShadow><cylinderGeometry args={[.16, .14, .25, 28]} /><meshStandardMaterial color="#e2a756" /></mesh><Ring position={[.18, .14, 0]} radius={.1} tube={.035} color="#e2a756" /><mesh position={[0, .26, 0]}><cylinderGeometry args={[.13, .13, .01, 24]} /><meshStandardMaterial color="#725641" /></mesh></group>
    <Clay position={[1.9, 1.54, -.85]} size={[.44, .09, .53]} color="#395d85" radius={.025} /><Clay position={[1.91, 1.63, -.87]} size={[.4, .08, .49]} color="#efd389" radius={.025} />
    <Plant position={[2.65, .08, .8]} scale={1.55} />
    <Clay position={[-1.65, 3, -1.7]} size={[1.9, .13, .6]} color="#caaa7a" radius={.05} />
    {['#e3b65d', '#819eab', '#ea906e'].map((color, i) => <Clay key={color} position={[-2.23 + i * .19, 3.35, -1.7]} size={[.15, .58 - i * .03, .33]} color={color} radius={.02} />)}
    <Plant position={[-1.05, 3.08, -1.66]} scale={.45} />
    <Clay position={[1.1, 3.46, -1.8]} size={[1.8, 1.1, .11]} color="#b69a7c" radius={.09} /><Clay position={[1.1, 3.46, -1.73]} size={[1.64, .95, .03]} color="#d4c2a4" radius={.045} />
    <Clay position={[.7, 3.52, -1.69]} size={[.48, .63, .02]} color="#e3eadb" rotation={[0, 0, -.12]} radius={.015} /><Clay position={[1.45, 3.36, -1.69]} size={[.5, .56, .02]} color="#9fc2d2" rotation={[0, 0, .13]} radius={.015} />
    <Ball position={[.7, 3.79, -1.62]} scale={[.055, .055, .065]} color="#e79562" /><Ball position={[1.44, 3.58, -1.62]} scale={[.055, .055, .065]} color="#e79562" />
  </group>
}

function Hologram({ enabled, still }: { enabled: boolean; still: boolean }) {
  const scan = useRef<THREE.Group>(null)
  const orbits = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (scan.current) scan.current.position.y = still ? 1.8 : .3 + (Math.sin(clock.elapsedTime * .85) + 1) * 1.48
    if (orbits.current) orbits.current.rotation.y = still ? 0 : clock.elapsedTime * .13
  })
  return <group visible={enabled}>
    <mesh position={[0, .07, .55]} receiveShadow><cylinderGeometry args={[1.43, 1.5, .17, 64]} /><meshStandardMaterial color="#174ca3" metalness={.55} roughness={.35} /></mesh>
    <Ring position={[0, .17, .55]} rotation={[-Math.PI / 2, 0, 0]} radius={1.32} tube={.034} color="#54c6ff" glow />
    <Ring position={[0, .07, .55]} rotation={[-Math.PI / 2, 0, 0]} radius={1.46} tube={.015} color="#5fd7ff" glow />
    <gridHelper args={[12, 24, '#2167b7', '#13488f']} position={[0, -.06, 0]} />
    <group ref={scan}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, .55]}><ringGeometry args={[1.2, 1.28, 64]} /><meshBasicMaterial color="#5ddaff" transparent opacity={.5} side={THREE.DoubleSide} /></mesh><mesh position={[0, -.08, .55]}><cylinderGeometry args={[1.23, 1.23, .12, 48, 1, true]} /><meshBasicMaterial color="#50cfff" transparent opacity={.13} side={THREE.DoubleSide} depthWrite={false} /></mesh></group>
    <group ref={orbits}>{Array.from({ length: 18 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2.4) * (2.1 + i % 3 * .35), .4 + i % 7 * .45, Math.cos(i * 2.4) * 2.1]}><sphereGeometry args={[.022 + i % 3 * .007, 8, 8]} /><meshBasicMaterial color="#77d9ff" /></mesh>)}</group>
    <pointLight position={[0, .5, 1]} intensity={3} color="#56bfff" distance={5} />
  </group>
}

function Director(props: StudyWorldProps) {
  const room = useRef<THREE.Group>(null)
  const mentor = useRef<THREE.Group>(null)
  const world = useRef<THREE.Group>(null)
  const { camera, invalidate } = useThree()
  const hologram = props.mentor === 'quant'
  const target = useRef(new THREE.Vector3())
  useEffect(() => { invalidate() }, [props.chapter, props.mentor, props.still, invalidate])
  useFrame(({ clock }, delta) => {
    const k = props.still ? 1 : 1 - Math.exp(-3.2 * Math.min(delta, .2))
    const pointer = props.still ? { x: 0, y: 0, scroll: 0 } : props.input.current
    target.current.set(hologram ? 5.2 : 6.4 + pointer.x * .8, hologram ? 4.1 : 5.3 + pointer.y * .35, hologram ? 9 : 8.8 - pointer.scroll * .7)
    camera.position.lerp(target.current, k)
    camera.lookAt(0, hologram ? 1.72 : 1.85, 0)
    if (room.current) {
      room.current.position.y = THREE.MathUtils.lerp(room.current.position.y, hologram ? -6 : 0, k)
      room.current.scale.setScalar(THREE.MathUtils.lerp(room.current.scale.x, hologram ? .75 : 1, k))
      room.current.visible = room.current.position.y > -5.9
    }
    if (mentor.current) {
      mentor.current.rotation.y = THREE.MathUtils.lerp(mentor.current.rotation.y, hologram ? .5 : .35 + pointer.x * .06, k)
      mentor.current.position.x = THREE.MathUtils.lerp(mentor.current.position.x, hologram ? 0 : -.7, k)
      mentor.current.position.z = THREE.MathUtils.lerp(mentor.current.position.z, hologram ? .55 : .58, k)
    }
    if (world.current) world.current.rotation.y = props.still ? 0 : Math.sin(clock.elapsedTime * .16) * .017 + pointer.x * .018
  })
  return <group ref={world}>
    <ambientLight intensity={hologram ? 1.2 : 1.7} />
    <hemisphereLight args={[hologram ? '#bce1ff' : '#fff2d6', hologram ? '#17377e' : '#b9ad92', 1.3]} />
    <directionalLight position={[-3, 7, 5]} intensity={2.5} color={hologram ? '#dcefff' : '#fff5df'} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.04} />
    <directionalLight position={[5, 3, -4]} intensity={1.8} color={hologram ? '#71b9ff' : '#fff4d8'} />
    <group ref={room}><StudyRoom /></group>
    <Hologram enabled={hologram} still={props.still} />
    <group ref={mentor} position={[-.7, .05, .58]} rotation={[0, .35, 0]}><Character {...props} /></group>
  </group>
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady() }, [onReady])
  return null
}

/** Locally authored geometry only. No downloaded models, fonts, textures or HDR files. */
export default function StudyWorld(props: StudyWorldProps) {
  return <Canvas orthographic shadows dpr={[1, 1.5]} frameloop={props.active && !props.still ? 'always' : 'demand'} camera={{ position: [6.4, 5.3, 8.8], zoom: 70, near: .1, far: 50 }} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
    onCreated={({ gl, camera, size }) => {
      camera.zoom = Math.min(size.width / 7.4, size.height / 5.2)
      camera.updateProjectionMatrix()
      gl.domElement.addEventListener('webglcontextlost', props.onFailure, { once: true })
    }} fallback={<div className="world-unavailable" aria-hidden="true" />}>
    <Suspense fallback={null}><ResponsiveCamera /><Director {...props} /><Ready onReady={props.onReady} /></Suspense>
  </Canvas>
}

function ResponsiveCamera() {
  const { camera, size, invalidate } = useThree()
  useEffect(() => { camera.zoom = Math.min(size.width / 7.4, size.height / 5.2); camera.updateProjectionMatrix(); invalidate() }, [camera, size.width, size.height, invalidate])
  return null
}
