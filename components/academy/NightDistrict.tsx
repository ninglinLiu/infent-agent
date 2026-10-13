"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Box, Cable, Glow, Panel, Pipe, SceneLink, type V3 } from './night-parts'
import { lessonsTexture } from './night-textures'

/** A warm rooftop tree, with steady lights so the rain remains the only busy motion. */
export function ChristmasTree({ p }: { p: V3 }) {
  const star = useMemo(() => {
    const shape = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .095 : .22
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: .055, bevelEnabled: false })
  }, [])
  useEffect(() => () => star.dispose(), [star])
  const garland = useMemo<V3[]>(() => Array.from({ length: 81 }, (_, i) => {
    const t = i / 80, a = t * Math.PI * 6, r = .6 * (1 - t) + .025
    return [Math.cos(a) * r, .38 + t * 1.52, Math.sin(a) * r]
  }), [])
  return <group position={p}>
    <mesh position={[0, .17, 0]} castShadow><cylinderGeometry args={[.11, .14, .34, 10]} /><meshStandardMaterial color="#704c32" /></mesh>
    {[[.7, .88, .68], [.53, .85, 1.09], [.35, .79, 1.51]].map(([r, h, y], i) => <mesh key={y} position={[0, y, 0]} rotation={[0, i * .3, 0]} castShadow receiveShadow><coneGeometry args={[r, h, 12]} /><meshStandardMaterial color={['#204c3e', '#28634b', '#367657'][i]} roughness={.86} metalness={.05} /></mesh>)}
    <Cable points={garland} r={.009} />
    {garland.filter((_, i) => i % 3 === 0).map((pos, i) => <mesh key={i} position={pos}><sphereGeometry args={[.027, 8, 6]} /><meshBasicMaterial color={i % 4 === 0 ? '#ffbb68' : '#ffe2a2'} toneMapped={false} /></mesh>)}
    {Array.from({ length: 15 }, (_, i) => {
      const tier = Math.floor(i / 5), a = i * 2.4, r = [.59, .44, .27][tier]
      return <mesh key={i} position={[Math.cos(a) * r, [.58, 1.02, 1.46][tier], Math.sin(a) * r]} castShadow><sphereGeometry args={[.062, 12, 8]} /><meshStandardMaterial color={i % 2 ? '#ba3d49' : '#d6ac61'} metalness={.55} roughness={.3} /></mesh>
    })}
    <mesh geometry={star} position={[0, 2.01, 0]} rotation={[0, .45, 0]}><meshBasicMaterial color="#ffda83" toneMapped={false} /></mesh>
    <Glow p={[0, 2.01, .08]} color="#ffc46b" size={.3} opacity={.25} />
    <pointLight position={[0, 1.2, .6]} color="#ffc875" intensity={2.2} distance={3.3} />
    {[[-.53, .12, .42], [.43, .1, .32]].map(([x, y, z], i) => <group key={x} position={[x, y, z]} rotation={[0, i ? -.3 : .2, 0]}>
      <Box p={[0, 0, 0]} s={[.32, y * 2, .28]} color={i ? '#ba8d57' : '#913747'} rough={.85} />
      <Box p={[0, y + .005, 0]} s={[.055, .008, .29]} color="#e8cb90" shadow={false} />
      <Box p={[0, 0, .145]} s={[.055, y * 2, .008]} color="#e8cb90" shadow={false} />
    </group>)}
  </group>
}

/** Course packs behind glass; the whole machine opens the short-course library. */
export function LessonMachine({ onOpen }: { onOpen: () => void }) {
  const glass = useMemo(() => lessonsTexture(), [])
  useEffect(() => () => glass.dispose(), [glass])
  return <SceneLink onOpen={onOpen}><group position={[3.75, .15, .5]} rotation={[0, -.15, 0]}>
    <Box p={[0, 1.06, 0]} s={[1.08, 2.12, .8]} color="#bcb7ad" metal={.25} rough={.55} />
    <Box p={[0, 1.06, .41]} s={[1.0, 2.0, .02]} color="#9c3544" />
    <mesh position={[0, 1.36, .425]}><planeGeometry args={[.86, 1.2]} /><meshBasicMaterial map={glass} color={[.72, .72, .72]} toneMapped={false} /></mesh>
    <Panel p={[0, 1.93, .42]} size={[.86, .2]} title="LESSONS" kind="light" color="#9c3544" ink="#fff2dc" frame={null} onClick={onOpen} />
    <Panel p={[0, .73, .43]} size={[.74, .12]} title="PICK A LESSON" kind="plate" color="#9c3544" ink="#fff2dc" frame={null} />
    <Box p={[0, .45, .44]} s={[.66, .16, .05]} color="#14181f" />
    <Box p={[.36, .82, .44]} s={[.1, .16, .03]} color="#2a2f38" />
    <Box p={[.36, .87, .458]} s={[.05, .016, .004]} color="#d8b76c" shadow={false} />
    <Glow p={[0, 1.35, .55]} color="#ffe1b1" size={.55} opacity={.12} />
  </group></SceneLink>
}

export function Postbox() {
  return <group position={[5.35, .15, 1.75]} rotation={[0, -.4, 0]}>
    <mesh position={[0, .2, 0]}><cylinderGeometry args={[.07, .09, .4, 12]} /><meshStandardMaterial color="#2a2c33" /></mesh>
    <mesh position={[0, .82, 0]} castShadow><cylinderGeometry args={[.24, .24, .86, 28]} /><meshStandardMaterial color="#d3242b" roughness={.35} metalness={.2} /></mesh>
    <mesh position={[0, 1.25, 0]} castShadow><sphereGeometry args={[.24, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#d3242b" roughness={.35} metalness={.2} /></mesh>
    {[1.04, .9].map(y => <Box key={y} p={[0, y, .225]} s={[.2, .035, .04]} color="#16171b" />)}
    <Panel p={[0, .66, .242]} size={[.24, .2]} title="POST" kind="plate" color="#d3242b" ink="#ffffff" frame={null} />
  </group>
}

/** Orange-poled convex mirror on the corner. */
export function CurveMirror() {
  return <group position={[-3.22, .15, 1.62]} rotation={[0, .9, 0]}>
    <Pipe from={[0, 0, 0]} to={[0, 2.5, 0]} r={.04} color="#e9732a" />
    <Pipe from={[0, 2.35, 0]} to={[0, 2.35, .2]} r={.025} color="#e9732a" />
    <group position={[0, 2.38, .26]} rotation={[-.12, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.34, .34, .05, 36]} /><meshStandardMaterial color="#e9732a" roughness={.4} /></mesh>
      <mesh position={[0, 0, .028 - .77 * Math.cos(.4)]} rotation={[Math.PI / 2, 0, 0]}><sphereGeometry args={[.77, 40, 6, 0, Math.PI * 2, 0, .4]} /><meshStandardMaterial color="#9fb0c4" metalness={.7} roughness={.12} /></mesh>
    </group>
  </group>
}

/** Only crossing stripes and lane dashes; the road has no text. */
export function RoadMarks() {
  return <group>
    {[1.9, 4.5, 7.1].map(x => <Box key={x} p={[x, -.012, 4.2]} s={[1.5, .01, .1]} color="#b7b5ae" shadow={false} />)}
    {Array.from({ length: 7 }, (_, i) => <Box key={i} p={[-4.85, -.012, -1.6 + i * .5]} s={[1.5, .01, .26]} color="#b7b5ae" shadow={false} />)}
    {Array.from({ length: 6 }, (_, i) => <Box key={i} p={[-6.6 + i * .5, -.012, 4.2]} s={[.26, .01, 3]} color="#b7b5ae" shadow={false} />)}
  </group>
}

/** Beckoning cat on the counter. */
export function Maneki({ p, still }: { p: V3; still: boolean }) {
  const paw = useRef<THREE.Group>(null)
  useFrame(({ clock }) => { if (paw.current) paw.current.rotation.x = still ? -.2 : -.2 + Math.sin(clock.elapsedTime * 3.2) * .35 })
  const white = <meshStandardMaterial color="#f7f2ea" roughness={.35} />
  return <group position={p} rotation={[0, -.35, 0]} scale={.9}>
    <mesh position={[0, .09, 0]} scale={[.1, .1, .085]}><sphereGeometry args={[1, 20, 16]} />{white}</mesh>
    <mesh position={[0, .22, .005]} scale={[.085, .075, .075]}><sphereGeometry args={[1, 20, 16]} />{white}</mesh>
    {[-.05, .05].map(x => <mesh key={x} position={[x, .29, 0]} rotation={[0, 0, -x * 4]}><coneGeometry args={[.025, .05, 4]} />{white}</mesh>)}
    {[-.028, .028].map(x => <mesh key={x} position={[x, .225, .07]}><sphereGeometry args={[.009, 8, 6]} /><meshBasicMaterial color="#1a1a1a" /></mesh>)}
    <mesh position={[0, .16, .01]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.07, .009, 6, 20]} /><meshStandardMaterial color="#d3242b" /></mesh>
    <mesh position={[0, .145, .08]}><sphereGeometry args={[.016, 10, 8]} /><meshStandardMaterial color="#e9c25a" metalness={.9} roughness={.25} /></mesh>
    <group ref={paw} position={[.07, .2, .03]} userData={{ live: true }}><mesh position={[0, .05, .01]} scale={[.025, .05, .025]}><sphereGeometry args={[1, 10, 8]} />{white}</mesh></group>
    <mesh position={[-.055, .07, .07]} rotation={[.3, 0, 0]} scale={[.035, .05, .006]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#e9c25a" metalness={.9} roughness={.25} /></mesh>
  </group>
}

/** Soroban-style Chinese abacus lying on the counter; beads drawn as one instanced mesh. */
export function Abacus({ p }: { p: V3 }) {
  const beads = useRef<THREE.InstancedMesh>(null)
  const RODS = 9
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), size = new THREE.Vector3(.0165, .012, .0115)
    let n = 0
    for (let r = 0; r < RODS; r++) {
      const x = -.17 + r * .0425
      for (let k = 0; k < 7; k++) {
        const z = k < 2 ? -.085 + k * .028 + (r % 3 === 0 ? .02 : 0) : -.005 + (k - 2) * .026 + (k - 2 < r % 4 ? 0 : .025)
        beads.current?.setMatrixAt(n++, m.compose(new THREE.Vector3(x, .02, z), q, size))
      }
    }
    if (beads.current) beads.current.instanceMatrix.needsUpdate = true
  }, [])
  return <group position={p} rotation={[0, .18, 0]}>
    {[-.115, .115].map(z => <Box key={z} p={[0, .02, z]} s={[.42, .04, .02]} color="#3a2216" />)}
    {[-.205, .205].map(x => <Box key={x} p={[x, .02, 0]} s={[.02, .04, .25]} color="#3a2216" />)}
    <Box p={[0, .025, -.04]} s={[.4, .015, .012]} color="#3a2216" />
    {Array.from({ length: RODS }, (_, r) => <mesh key={r} position={[-.17 + r * .0425, .02, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.0025, .0025, .22, 4]} /><meshStandardMaterial color="#b8a27a" /></mesh>)}
    <instancedMesh ref={beads} args={[undefined, undefined, RODS * 7]} castShadow><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#6b3a22" roughness={.4} /></instancedMesh>
  </group>
}
