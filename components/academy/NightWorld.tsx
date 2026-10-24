"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import * as THREE from 'three'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js'
import type { NightDestination } from './night-navigation'
import { AMBER, Bake, Books, Box, Cable, CYAN, Glow, Lantern, Panel, PINK, Pipe, Plant, SceneLink, UNREFLECTED, Unreflected, type V3 } from './night-parts'
import { Abacus, ChristmasTree, CurveMirror, LessonMachine, Maneki, Postbox, RoadMarks } from './NightDistrict'
import { shojiTexture, texture } from './night-textures'

type Props = { onOpen: (view: NightDestination) => void; onAbout: () => void; still: boolean; active: boolean; onReady: () => void; onFailure: () => void; reset: number; focus: NightDestination | null }
type Tier = 'high' | 'mid' | 'low'

function Shoji({ p, size }: { p: V3; size: [number, number] }) {
  const map = useMemo(() => shojiTexture(), [])
  useEffect(() => () => map.dispose(), [map])
  return <mesh position={p}><planeGeometry args={size} /><meshBasicMaterial map={map} color={[1.08, 1.02, .96]} toneMapped={false} /></mesh>
}

function Noren({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => { group.current?.children.forEach((child, i) => { child.rotation.x = still ? 0 : Math.sin(clock.elapsedTime * 1.2 + i) * .05 }) })
  return <group ref={group} userData={{ live: true }}>{['READ', 'THINK', 'BUILD'].map((ch, i) => <group key={ch} position={[-1.15 + i * 1.15, 2.46, 1.3]}><Panel p={[0, -.16, 0]} size={[1.1, .32]} title={ch} kind="plate" color="#4a3327" ink="#f3efe6" frame={null} /></group>)}</group>
}

function Building({ onOpen, still }: Pick<Props, 'onOpen' | 'still'>) {
  return <group>
    {/* A small corner building, open ground floor and occupied upper studio. */}
    <Box p={[0, .2, -.2]} s={[4.15, .18, 3.2]} color="#5f626c" surface="wood" repeat={[4, 3]} />
    <Box p={[0, 1.8, -1.6]} s={[3.7, 3.2, .18]} color="#4a5160" surface="tile" repeat={[3.1, 2.7]} />
    <Box p={[1.85, 1.7, -.25]} s={[.17, 3.1, 2.75]} color="#48505e" surface="tile" repeat={[2.3, 2.6]} />
    <Box p={[-1.85, 1.7, -.5]} s={[.16, 3.1, 2.2]} color="#414955" surface="tile" repeat={[1.8, 2.6]} />
    <Box p={[0, 3.25, -.25]} s={[4, .28, 3.15]} color="#28313e" />
    <Box p={[0, 4.45, -1.48]} s={[3.7, 2.2, .2]} color="#4e5663" surface="tile" repeat={[3.1, 1.8]} />
    <Box p={[1.85, 4.45, -.18]} s={[.2, 2.3, 2.8]} color="#343c4a" />
    <Box p={[-1.82, 4.45, -.18]} s={[.18, 2.3, 2.8]} color="#4a4f5e" surface="tile" repeat={[2.3, 1.9]} />
    <Box p={[0, 5.65, -.2]} s={[4.12, .22, 3.25]} color="#475160" />
    {/* Cladding and ledges give the facade a human scale. */}
    {[3.6, 3.84, 4.08, 4.32, 4.56, 4.8, 5.04, 5.28].map(y => <Box key={y} p={[1.971, y, -.18]} s={[.023, .013, 2.8]} color="#141f2d" shadow={false} />)}
    <Box p={[0, 3.45, 1.25]} s={[3.82, .18, .2]} color="#576071" />
    <Box p={[0, 5.43, 1.25]} s={[3.82, .19, .2]} color="#4a505c" />
    {[-1.78, -.66, .65, 1.78].map(x => <Box key={x} p={[x, 4.45, 1.24]} s={[.075, 1.86, .15]} color="#252b38" />)}
    <Box p={[0, 4.45, 1.23]} s={[3.5, .055, .15]} color="#293340" />
    <Box p={[0, 4.45, 1.2]} s={[3.5, 1.79, .03]} color="#967771" />
    <Shoji p={[-.67, 4.65, 1.232]} size={[2.1, 1.25]} />
    <Box p={[1.13, 4.45, 1.235]} s={[.94, 1.77, .012]} color="#70523d" glow="#63432c" />
    {[-.65, .62].map(x => <Box key={x} p={[x, 4.45, 1.29]} s={[.055, 1.8, .08]} color="#262d39" />)}
    <Box p={[0, 4.37, 1.28]} s={[3.55, .055, .08]} color="#33313a" />
    <Box p={[-.58, 3.69, 1.39]} s={[2.24, .1, .44]} color="#39454c" />
    <Books p={[-1.48, 3.72, 1.42]} count={13} />
    <Plant p={[.3, 3.74, 1.42]} scale={.34} />
    <Panel p={[.72, 4.85, 1.36]} size={[1.63, .45]} title="READ & THINK" color={AMBER} onClick={() => onOpen('academy')} />
    {/* A quiet rooftop garden with a warm Christmas tree as the silhouette. */}
    <ChristmasTree p={[.45, 5.77, -.15]} />
    <Box p={[-1.18, 5.99, -.92]} s={[.78, .42, .62]} color="#616d76" />
    {Array.from({ length: 6 }, (_, i) => <Box key={i} p={[-1.47 + i * .115, 5.99, -.598]} s={[.035, .28, .018]} color="#283944" shadow={false} />)}
    <Pipe from={[-1.92, 5.8, -1.55]} to={[-1.92, 6.37, -1.55]} /><Pipe from={[-1.92, 6.37, -1.55]} to={[1.85, 6.37, -1.55]} />
    <Pipe from={[1.85, 5.8, -1.55]} to={[1.85, 6.37, -1.55]} />
    <Box p={[1.987, 3.8, -.6]} s={[.05, 3.2, .065]} color="#788181" />
    <Box p={[2.02, 2.15, -.6]} s={[.16, .45, .4]} color="#797679" />
    {/* Main neon, striped cloth canopy and a short indigo noren. */}
    <Panel p={[0, 3.14, 1.61]} size={[3.77, .83]} title="omniAI" sub="YOUR FINANCIAL AGENT" color={PINK} onClick={() => onOpen('workspace')} />
    <group position={[0, 2.46, 1.45]} rotation={[.23, 0, 0]}>
      <Box p={[0, 0, 0]} s={[4.25, .09, 1.3]} color="#e3bd9d" />
      {Array.from({ length: 11 }, (_, i) => <Box key={i} p={[-1.94 + i * .387, .055, 0]} s={[.18, .018, 1.3]} color="#fffbf5" shadow={false} />)}
      <Box p={[0, -.13, .65]} s={[4.25, .27, .035]} color="#d7ac8c" />
    </group>
    <Noren still={still} />
    <Pipe from={[-1.77, .3, 1.12]} to={[-1.77, 2.58, 1.12]} r={.035} color="#765565" />
    <Pipe from={[1.77, .3, 1.12]} to={[1.77, 2.58, 1.12]} r={.035} color="#765565" />
    {/* Ground floor studio: shelves, books, light, research desk. */}
    <Box p={[-.63, 1.56, -1.32]} s={[1.99, .075, .47]} color="#795c51" surface="wood" repeat={[2, 1]} />
    <Box p={[-.63, 2.13, -1.32]} s={[1.99, .075, .47]} color="#795c51" surface="wood" repeat={[2, 1]} />
    <Books p={[-1.5, 1.6, -1.23]} count={14} /><Books p={[-1.46, 2.17, -1.23]} count={12} />
    <Box p={[-.1, 2.75, -.6]} s={[2.8, .06, .18]} color="#fff2cd" glow="#ffab62" shadow={false} />
    <pointLight position={[-.1, 2.2, .1]} color="#ffb873" intensity={1.5} distance={5} decay={2} />
    <Box p={[-.4, 1.11, .72]} s={[2.5, .14, .88]} color="#b58a6e" surface="wood" repeat={[3, 1]} />
    <Box p={[-.4, .7, .5]} s={[2.2, .72, .55]} color="#48535b" />
    {Array.from({ length: 12 }, (_, i) => <Box key={i} p={[-1.4 + i * .18, .7, .787]} s={[.075, .69, .022]} color="#6c6c65" shadow={false} />)}
    <Box p={[.45, 1.28, .35]} s={[.42, .06, .3]} color="#292e39" />
    <Box p={[.45, 1.5, .26]} s={[.09, .48, .08]} color="#292e39" />
    <Panel p={[.45, 1.75, .35]} size={[.91, .58]} title="RESEARCH" sub="FOLLOW THE EVIDENCE" color={CYAN} onClick={() => onOpen('workspace')} />
    <Books p={[-1.38, 1.2, .4]} count={5} />
    <mesh position={[-.53, 1.34, .8]} castShadow><cylinderGeometry args={[.1, .08, .24, 20]} /><meshStandardMaterial color="#e9d9c3" /></mesh>
    <mesh position={[-.53, 1.464, .8]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.08, 20]} /><meshBasicMaterial color="#302421" /></mesh>
    <Plant p={[-1.35, 1.2, .89]} scale={.38} />
    <Maneki p={[.68, 1.18, .98]} still={still} />
    <Abacus p={[-.08, 1.18, .93]} />
    {[-.98, .18].map(x => <group key={x} position={[x, .29, 1.67]}><mesh position={[0, .57, 0]} castShadow><cylinderGeometry args={[.24, .24, .1, 20]} /><meshStandardMaterial color="#b86278" roughness={.5} /></mesh>{[-.14, .14].flatMap(a => [-.14, .14].map(b => <Pipe key={`${a}/${b}`} from={[a, -.14, b]} to={[a * .7, .54, b * .7]} r={.018} color="#b38e78" />))}</group>)}
    {/* Hanging vertical sign and roof lamp. */}
    <Pipe from={[-1.6, 5.8, .75]} to={[-2.55, 5.8, .75]} r={.035} />
    <Pipe from={[-2.4, 5.8, .75]} to={[-2.4, 5.8, 1.68]} r={.035} />
    <Panel p={[-2.4, 4.55, 1.68]} size={[.67, 2.4]} title="学習室" sub="夜間自習・二階" vertical color={CYAN} onClick={() => onOpen('academy')} />
    <Glow p={[-2.4, 4.5, 1.82]} color={CYAN} size={1.1} opacity={.45} />
    <pointLight position={[-2.7, 4.4, 1.9]} intensity={1} distance={6} color={CYAN} />
    <Panel p={[2.01, 4.5, -.22]} size={[2.08, .88]} title="CURIOSITY" color={AMBER} rotation={[0, Math.PI / 2, 0]} />
    {/* Floor directory on the corner, lit like a Japanese tenant sign. */}
    <group position={[2.27, 2.92, 1.02]} rotation={[0, Math.PI / 2 - .45, 0]}>
      <Pipe from={[-.38, .3, -.2]} to={[0, .3, -.06]} r={.02} /><Pipe from={[-.38, -.3, -.2]} to={[0, -.3, -.06]} r={.02} />
      <Box p={[0, 0, -.06]} s={[.66, 1.0, .1]} color="#2a2f3a" metal={.5} />
      <Panel p={[0, .38, 0]} size={[.56, .14]} title="EXPLORE" kind="plate" color="#2a2f3a" ink="#e8e4da" frame={null} />
      <Panel p={[0, .16, 0]} size={[.56, .2]} title="2F · STUDY" kind="light" color="#f6f1e4" ink="#1b1d22" frame={null} onClick={() => onOpen('academy')} />
      <Panel p={[0, -.08, 0]} size={[.56, .2]} title="1F · omniAI" kind="light" color="#c7202a" ink="#ffffff" frame={null} onClick={() => onOpen('workspace')} />
      <Panel p={[0, -.32, 0]} size={[.56, .2]} title="CASE FILES" kind="light" color="#f2c230" ink="#1b1d22" frame={null} onClick={() => onOpen('practice')} />
    </group>
    <Plant p={[1.85, .15, 1.3]} scale={1.1} />
    <Plant p={[-1.63, 5.77, .5]} scale={.62} />
  </group>
}

function Street({ onOpen, onAbout }: Pick<Props, 'onOpen' | 'onAbout'>) {
  return <group>
    {/* Case-file vending machine: each file is an invitation to begin. */}
    <SceneLink onOpen={() => onOpen('practice')}><group position={[2.55, .15, .58]} rotation={[0, -.15, 0]}>
      <Box p={[0, 1.03, 0]} s={[1.12, 2.02, .77]} color="#88704f" metal={.4} rough={.45} />
      <Box p={[0, 1.1, .398]} s={[.96, 1.61, .026]} color="#36281c" />
      <Panel p={[0, 1.92, .42]} size={[1.0, .22]} title="CASE FILES" color={CYAN} frame={null} onClick={() => onOpen('practice')} />
      {[.72, 1.07, 1.42].flatMap((y, j) => [-.31, -.02, .27].map((x, i) => <group key={`${i}/${j}`}><Box p={[x, y, .433]} s={[.2, .27, .03]} color={['#fdac75', '#77cfcc', '#f093bb'][(i + j) % 3]} shadow={false} /><Box p={[x, y - .04, .454]} s={[.14, .017, .012]} color="#fbf3d9" shadow={false} /></group>))}
      {[1.42, 1.07, .72].map((y, j) => <Panel key={y} p={[0, y - .2, .45]} size={[.9, .07]} title={['01 · PRICE & VALUE', '02 · RISK RULES', '03 · TEST YOUR IDEAS'][j]} kind="plate" color={['#b4813b', '#d08a1c', '#c7202a'][j]} ink="#ffffff" frame={null} ppu={700} />)}
      <Box p={[0, .34, .43]} s={[.63, .17, .04]} color="#060e1b" />
      <Box p={[.39, .55, .46]} s={[.08, .055, .05]} color={PINK} glow={PINK} shadow={false} />
      <Glow p={[0, 1.05, .5]} color={CYAN} size={.6} opacity={.2} />
    </group></SceneLink>
    <pointLight position={[2.55, 1.3, 1.7]} color={CYAN} intensity={.5} distance={4} />
    {/* Utility pole with address plate, pole advert, transformer, lamp and wires. */}
    <Pipe from={[-3.1, .1, -.8]} to={[-3.1, 6.6, -.8]} r={.075} color="#5a5966" />
    <group position={[-3.1, 0, -.8]} rotation={[0, .75, 0]}>
      <mesh position={[-.28, 5.35, 0]}><cylinderGeometry args={[.17, .17, .52, 18]} /><meshStandardMaterial color="#8b929c" metalness={.6} roughness={.4} /></mesh>
      <Pipe from={[-.1, 5.6, 0]} to={[-.42, 5.6, 0]} r={.02} />
    </group>
    <Pipe from={[-3.1, 5.92, -.8]} to={[-2.8, 5.92, 1.4]} r={.038} />
    <Pipe from={[-2.8, 5.92, 1.4]} to={[-2.8, 5.5, 1.4]} r={.025} />
    <mesh position={[-2.8, 5.22, 1.4]}><sphereGeometry args={[.3, 28, 20]} /><meshStandardMaterial color="#ffd0eb" emissive="#ff58ad" emissiveIntensity={3} toneMapped={false} /></mesh>
    <Glow p={[-2.8, 5.22, 1.75]} color={PINK} size={.8} />
    <pointLight position={[-2.8, 5.1, 1.45]} color={PINK} intensity={1} distance={6} />
    <Cable points={[[-3.1, 6.45, -.8], [-.1, 6.05, -1.9], [3.7, 6.8, -2.3]]} />
    <Cable points={[[-3.1, 6.05, -.8], [-2.4, 4.7, -.6], [-1.9, 4.5, -.35]]} />
    <Cable points={[[-3.1, 6.3, -.8], [-3.4, 5.9, 3.5], [-3.6, 6.4, 9]]} />
    {/* Bicycle and a front-door A-board linking to the original product showcase. */}
    <group position={[3.15, .5, -2.85]} rotation={[0, .9, 0]}>
      {[-.48, .48].map(x => <mesh key={x} position={[x, 0, 0]}><torusGeometry args={[.34, .028, 8, 32]} /><meshStandardMaterial color="#252d3c" metalness={.5} /></mesh>)}
      <Pipe from={[-.48, 0, 0]} to={[0, .49, 0]} r={.019} color="#b77783" /><Pipe from={[0, .49, 0]} to={[.48, 0, 0]} r={.019} color="#b77783" /><Pipe from={[-.48, 0, 0]} to={[.16, .01, 0]} r={.019} color="#b77783" /><Pipe from={[.16, .01, 0]} to={[.35, .62, 0]} r={.021} color="#b77783" /><Pipe from={[0, .49, 0]} to={[.35, .55, 0]} r={.019} color="#b77783" /><Box p={[0, .53, 0]} s={[.2, .06, .12]} color="#1c2732" />
      <Box p={[.42, .72, 0]} s={[.3, .2, .24]} color="#3a3f4a" />
    </group>
    <SceneLink onOpen={onAbout}><group position={[1.2, .15, 2.0]} rotation={[0, .18, 0]}>
      <Panel p={[0, .6, .1]} size={[.88, 1.06]} rotation={[-.2, 0, 0]} title="ABOUT" lines={'omniAI\nPRODUCT & TEAM\nEXPLORE →'} kind="light" color="#ecd8ad" ink="#283e39" frame="#6e4a2c" depth={.05} onClick={onAbout} back />
      <Box p={[0, .55, -.14]} s={[.92, 1.12, .04]} rotation={[.2, 0, 0]} color="#6e4a2c" surface="wood" />
    </group></SceneLink>
  </group>
}

function StreetDetails({ still }: { still: boolean }) {
  const tail = useRef<THREE.Group>(null)
  useFrame(({ clock }) => { if (tail.current) tail.current.rotation.z = still ? .15 : .15 + Math.sin(clock.elapsedTime * 1.5) * .13 })
  return <group>
    {/* Pavement, curbs and tactile paving around the corner block; the road beyond stays wet and reflective. */}
    <Box p={[1.425, .05, -.71]} s={[9.55, .2, 6.18]} color="#4a5263" surface="pave" repeat={[10.6, 6.9]} rough={.55} metal={.35} />
    {Array.from({ length: 18 }, (_, i) => <Box key={`curb-${i}`} p={[-3.27 + i * .54, .1, 2.48]} s={[.52, .22, .2]} color={i % 3 ? '#80838f' : '#69717f'} rough={.7} />)}
    {Array.from({ length: 12 }, (_, i) => <Box key={`side-${i}`} p={[-3.45, .1, -3.53 + i * .54]} s={[.2, .22, .52]} color={i % 3 ? '#80838f' : '#69717f'} rough={.7} />)}
    <Box p={[6.3, .1, -.71]} s={[.2, .22, 6.38]} color="#737885" rough={.7} />
    <Box p={[1.425, .1, -3.9]} s={[9.95, .22, .2]} color="#737885" rough={.7} />
    <Box p={[2.1, .156, 2.12]} s={[7.8, .014, .3]} color="#e3b923" surface="pave" repeat={[26, 1]} rough={.5} shadow={false} />
    <mesh position={[2.8, -.012, 3.2]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.36, 40]} /><meshStandardMaterial color="#26323f" metalness={.8} roughness={.28} /></mesh>
    {[-.16, 0, .16].map(z => <Box key={z} p={[2.8, -.004, 3.2 + z]} s={[.47, .015, .027]} color="#727384" shadow={false} />)}
    {/* A freestanding link belongs to the street, not a floating interface. */}
    <group position={[-2.5, .15, 2.0]} rotation={[0, .18, 0]}>
      <Pipe from={[-.49, 0, 0]} to={[-.49, 1.02, 0]} r={.03} color="#ba9a86" /><Pipe from={[.49, 0, 0]} to={[.49, 1.02, 0]} r={.03} color="#ba9a86" />
      <Box p={[0, .025, 0]} s={[1.3, .055, .48]} color="#353743" />
      <Panel p={[0, .91, .025]} size={[1.28, .58]} title="GitHub ↗" sub="NINGLIN LIU" color="#d3b2ff" onClick={() => window.open('https://github.com/ninglinLiu', '_blank', 'noopener,noreferrer')} />
    </group>
    {/* Vermilion tea-house parasol over a red-felt bench, book crates and a sheltered cat. */}
    <group position={[-2.94, .15, -.43]}>
      <Pipe from={[0, 0, 0]} to={[0, 2.6, 0]} r={.025} color="#c9b48f" />
      <mesh position={[0, 2.38, 0]} rotation={[0, .2, 0]} castShadow><coneGeometry args={[.9, .34, 16, 1, true]} /><meshStandardMaterial color="#c3312a" side={THREE.DoubleSide} roughness={.55} emissive="#3a0805" /></mesh>
      {Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8 + .2; return <Pipe key={i} from={[0, 2.55, 0]} to={[Math.cos(a) * .9, 2.21, Math.sin(a) * .9]} r={.006} color="#e2c79a" /> })}
      <group position={[0, .12, -.43]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, .44, 0]} s={[1.42, .1, .5]} color="#9b735f" surface="wood" />
        <Box p={[0, .5, 0]} s={[1.3, .02, .52]} color="#c0272d" rough={.9} />
        {[-.55, .55].map(x => <Box key={x} p={[x, .2, 0]} s={[.08, .4, .4]} color="#6e4a2c" />)}
      </group>
    </group>
    <group position={[-2.44, .15, .93]}>
      <Box p={[0, .22, 0]} s={[.61, .44, .61]} color="#845e48" surface="wood" />
      {[.09, .21, .33].map(y => <Box key={y} p={[0, y, .314]} s={[.65, .065, .03]} color="#ba8865" shadow={false} />)}
      <Books p={[-.23, .46, -.1]} count={3} />
      <group position={[.02, .57, .12]}>
        <mesh scale={[.2, .2, .24]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#c4aa8b" /></mesh>
        <mesh position={[0, .22, .08]} scale={[.16, .145, .15]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#d9c0a0" /></mesh>
        {[-.1, .1].map(x => <mesh key={x} position={[x, .35, .07]} rotation={[0, 0, -x * 2]}><coneGeometry args={[.075, .15, 3]} /><meshStandardMaterial color="#b69380" /></mesh>)}
        {[-.062, .062].map(x => <Box key={x} p={[x, .24, .214]} s={[.047, .014, .01]} color="#352c36" shadow={false} />)}
        <group ref={tail} position={[.16, -.06, -.13]} userData={{ live: true }}><Pipe from={[0, 0, 0]} to={[.26, .11, 0]} r={.045} color="#b99777" /><Pipe from={[.26, .11, 0]} to={[.3, .25, .015]} r={.042} color="#d5b699" /></group>
      </group>
    </group>
    {/* Warm bulbs and paper chōchin below the awning. */}
    <Cable points={[[-2.07, 2.47, 2.1], [0, 2.2, 2.17], [2.1, 2.47, 2.1]]} />
    {Array.from({ length: 9 }, (_, i) => { const x = -1.95 + i * .49; return <mesh key={i} position={[x, 2.2 + Math.pow(x / 2, 2) * .25 - .075, 2.15]}><sphereGeometry args={[.035, 10, 8]} /><meshBasicMaterial color={[3, 1.4, .6]} toneMapped={false} /></mesh> })}
    <Lantern p={[-1.55, 2.4, 1.8]} text="✦" still={still} cord={.08} />
    <Lantern p={[1.55, 2.4, 1.8]} text="✦" still={still} phase={2} cord={.08} />
    {/* Side wall machinery and rear details reward a full orbit. */}
    <group position={[2.19, 3.25, -.64]}>
      <Box p={[0, 0, 0]} s={[.47, .7, 1.04]} color="#777d88" />
      <mesh position={[.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.245, .03, 8, 32]} /><meshStandardMaterial color="#343b4a" metalness={.7} /></mesh>
      {[-.12, 0, .12].map(y => <Box key={y} p={[.257, y, 0]} s={[.017, .025, .41]} color="#394454" shadow={false} />)}
      <Cable points={[[.16, -.32, .33], [.19, -.74, .33], [-.12, -.99, .42]]} />
    </group>
    {/* A warm back door and a small reading plaque. */}
    <group position={[0, 0, -1.73]}>
      <Box p={[.2, 4.35, 0]} s={[1.8, 1.19, .08]} color="#263445" />
      <Box p={[.2, 4.35, -.045]} s={[1.64, 1.03, .014]} color="#c8a16e" glow="#765633" />
      <Box p={[.2, 4.35, -.072]} s={[.055, 1.08, .04]} color="#46516a" />
      <Box p={[.2, 4.35, -.072]} s={[1.7, .06, .04]} color="#46516a" />
      <Box p={[.1, 1.25, -.03]} s={[1.2, 2.0, .07]} color="#405464" />
      <Box p={[-.36, 1.2, -.085]} s={[.06, .19, .04]} color="#cfb390" />
      <group position={[.1, 2.78, -.06]}><Box p={[0, 0, -.06]} s={[.22, .1, .12]} color="#2a2f38" /><Box p={[0, -.07, -.1]} s={[.16, .04, .06]} color="#ffe2b0" glow="#ffb35c" shadow={false} /><Glow p={[0, -.25, -.16]} rotation={[0, Math.PI, 0]} color="#ffb35c" size={.7} opacity={.4} /></group>
      <Panel p={[1.48, 1.75, -.12]} size={[.68, .46]} title="AFTER HOURS" sub="READ · MAKE · REPEAT" rotation={[0, Math.PI, 0]} kind="wood" color="#7a5232" frame="#3a2416" />
      <Pipe from={[-1.52, .3, -.16]} to={[-1.52, 5.9, -.16]} r={.027} /><Pipe from={[-.99, .3, -.16]} to={[-.99, 5.9, -.16]} r={.027} />
      {Array.from({ length: 15 }, (_, i) => <Pipe key={i} from={[-1.52, .46 + i * .36, -.16]} to={[-.99, .46 + i * .36, -.16]} r={.019} />)}
    </group>
    <Plant p={[2.8, .15, -1.85]} scale={1.08} />
    <Box p={[2.97, .385, -.64]} s={[.45, .47, .47]} color="#927664" surface="wood" />
    <Box p={[2.97, .635, -.64]} s={[.45, .035, .12]} color="#cab59c" />
    <group position={[5.9, -.02, 2.95]}><Box p={[0, .025, 0]} s={[.4, .06, .4]} color="#55525a" /><mesh position={[0, .3, 0]}><coneGeometry args={[.17, .55, 16]} /><meshStandardMaterial color="#e2733f" /></mesh><mesh position={[0, .31, 0]}><cylinderGeometry args={[.075, .107, .1, 16]} /><meshStandardMaterial color="#e2d4bd" /></mesh></group>
  </group>
}

function Rain({ still }: { still: boolean }) {
  const COUNT = 1800
  const ref = useRef<THREE.LineSegments>(null)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 6), speeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const x = Math.sin(i * 127.1) * 15, y = ((i * .1373) % 1) * 15, z = 2.5 + Math.cos(i * 311.7) * 14, l = .2 + ((i * .618) % 1) * .18
      positions.set([x, y, z, x - l * .18, y + l, z], i * 6); speeds[i] = 7 + ((i * .377) % 1) * 4
    }
    return { positions, speeds }
  }, [])
  useFrame((_, delta) => {
    if (still || !ref.current) return
    const a = ref.current.geometry.attributes.position.array as Float32Array, dt = Math.min(delta, .05)
    for (let i = 0; i < COUNT; i++) {
      const k = i * 6, l = a[k + 4] - a[k + 1]
      a[k + 1] -= dt * speeds[i]; if (a[k + 1] < -.02) a[k + 1] += 15
      a[k + 4] = a[k + 1] + l
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return <lineSegments ref={ref} frustumCulled={false}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><lineBasicMaterial color="#b9accf" transparent opacity={.12} depthWrite={false} /></lineSegments>
}

function Ripples({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => { group.current?.children.forEach((child, i) => { const t = still ? .4 : (clock.elapsedTime * .65 + i * .137) % 1; child.scale.setScalar(.2 + t * .6); ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - t) * .2 }) })
  const spots = useMemo(() => Array.from({ length: 20 }, (_, i): V3 => i % 3 === 0 ? [-4.1 - Math.abs(Math.sin(i * 3.1)) * 2.4, -.008, Math.cos(i * 5.3) * 3] : [Math.sin(i * 12.78) * 6, -.008, 4.6 + Math.cos(i * 6.1) * 1.9]), [])
  return <group ref={group}>{spots.map((p, i) => <mesh key={i} position={p} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.28, .29, 40]} /><meshBasicMaterial color={i % 2 ? CYAN : PINK} transparent opacity={.13} depthWrite={false} /></mesh>)}</group>
}

function Sky() {
  const map = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 512
    const x = c.getContext('2d')!, g = x.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, '#f5f3fa'); g.addColorStop(1, '#f5f3fa')
    x.fillStyle = g; x.fillRect(0, 0, 4, 512); return texture(c)
  }, [])
  useEffect(() => () => map.dispose(), [map])
  return <mesh><sphereGeometry args={[150, 32, 24]} /><meshBasicMaterial map={map} side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} /></mesh>
}

function StreetBackdrop() {
  // A seamless lavender backdrop; the raised pavement still receives the house shadows.
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, 0]}><planeGeometry args={[120, 120]} /><meshBasicMaterial color="#f5f3fa" toneMapped={false} /></mesh>
}

const ORIGIN = new THREE.Vector2()
const HOME: V3 = [3.7, 7.6, 20.2], LOOK: V3 = [.55, 3.0, .15]

function CameraRig({ reset, focus, still }: { reset: number; focus: NightDestination | null; still: boolean }) {
  const { camera, size } = useThree()
  const controls = useRef<React.ElementRef<typeof OrbitControls>>(null)
  const goal = useRef(new THREE.Vector3())
  const target = useRef(new THREE.Vector3())
  useEffect(() => {
    camera.layers.enable(UNREFLECTED)
    camera.position.set(...HOME)
    camera.lookAt(...LOOK)
    controls.current?.target.set(...LOOK); controls.current?.update()
  }, [camera, size.width, size.height, reset])
  useFrame((_, delta) => {
    if (!focus || !controls.current) return
    if (focus === 'academy') { goal.current.set(4.4, 5.8, 10); target.current.set(-.2, 3.5, .9) }
    else if (focus === 'practice' || focus === 'lessons') { goal.current.set(6.7, 3.6, 7.4); target.current.set(2.1, 1.45, .8) }
    else { goal.current.set(4.6, 3.4, 8.6); target.current.set(0, 1.65, .5) }
    const k = still ? 1 : 1 - Math.exp(-4 * Math.min(delta, .05))
    camera.position.lerp(goal.current, k); controls.current.target.lerp(target.current, k); controls.current.update()
  })
  return <OrbitControls ref={controls} enabled={!focus} target={LOOK} enablePan={false} enableZoom minDistance={8.5} maxDistance={30} minPolarAngle={.25} maxPolarAngle={Math.PI / 2 - .05} rotateSpeed={.65} zoomSpeed={.85} enableDamping dampingFactor={.065} />
}

/**
 * The scene renders straight to the canvas so the browser's MSAA keeps edges and sign text crisp; that frame
 * is copied, bloomed at half resolution and added back. Cheaper than a multisampled HDR composer on iGPUs.
 */
function NeonBloom() {
  const { gl, scene, camera } = useThree()
  const fx = useRef<{ frame: THREE.WebGLRenderTarget; bloom: UnrealBloomPass; quad: FullScreenQuad; size: THREE.Vector2 } | null>(null)
  useEffect(() => {
    const frame = new THREE.WebGLRenderTarget(1, 1)
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .12, .36, 1.1)
    const add = new THREE.ShaderMaterial({ ...CopyShader, uniforms: THREE.UniformsUtils.clone(CopyShader.uniforms), blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true })
    const quad = new FullScreenQuad(add)
    fx.current = { frame, bloom, quad, size: new THREE.Vector2() }
    return () => { fx.current = null; frame.dispose(); bloom.dispose(); add.dispose(); quad.dispose() }
  }, [gl])
  useFrame(() => {
    gl.setRenderTarget(null); gl.render(scene, camera)
    const f = fx.current
    if (!f) return
    gl.getDrawingBufferSize(f.size)
    if (f.frame.width !== f.size.x || f.frame.height !== f.size.y) { f.frame.setSize(f.size.x, f.size.y); f.bloom.setSize(f.size.x, f.size.y); gl.setRenderTarget(f.frame); gl.setRenderTarget(null) }
    gl.copyFramebufferToTexture(ORIGIN, f.frame.texture)
    f.bloom.render(gl, f.frame, f.frame, 0, false)
    ;(f.quad.material as THREE.ShaderMaterial).uniforms.tDiffuse.value = f.bloom.renderTargetsHorizontal[0].texture
    gl.setRenderTarget(null); gl.autoClear = false; f.quad.render(gl); gl.autoClear = true
  }, 1)
  return null
}

/** Nothing static moves, so shadows are rendered for the first frames only. */
function ShadowBake({ tier }: { tier: Tier }) {
  const gl = useThree(s => s.gl)
  const frames = useRef(0)
  useEffect(() => {
    // data-quality on the canvas shows which tier FrameBudget settled on.
    gl.shadowMap.autoUpdate = false; frames.current = 0; gl.domElement.dataset.quality = tier
    return () => { gl.shadowMap.autoUpdate = true }
  }, [gl, tier])
  useFrame(() => { if (frames.current++ < 8) gl.shadowMap.needsUpdate = true })
  return null
}

function FrameBudget({ onSlow, active, limit }: { onSlow: () => void; active: boolean; limit: number }) {
  const sample = useRef({ frames: 0, elapsed: 0, checked: false })
  useEffect(() => { sample.current = { frames: 0, elapsed: 0, checked: false } }, [active, limit])
  useFrame((_, delta) => {
    const s = sample.current
    if (!active || s.checked) return
    s.frames++
    if (s.frames > 45) s.elapsed += Math.min(delta, .15)
    if (s.frames === 165) { s.checked = true; if (s.elapsed / 120 > limit) onSlow() }
  })
  return null
}

function Lifecycle({ onReady, onFailure }: Pick<Props, 'onReady' | 'onFailure'>) {
  const { gl } = useThree()
  useEffect(() => { onReady(); const canvas = gl.domElement; canvas.addEventListener('webglcontextlost', onFailure); return () => canvas.removeEventListener('webglcontextlost', onFailure) }, [gl, onReady, onFailure])
  return null
}

export default function NightWorld(props: Props) {
  const [tier, setTier] = useState<Tier>('high')
  const onSlow = useCallback(() => setTier(t => t === 'high' ? 'mid' : 'low'), [])
  const [native] = useState(() => typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)
  // Native sharpness up to 2x with MSAA on top; FrameBudget steps down when frames run long.
  const dpr = tier === 'high' ? Math.min(2, native) : tier === 'mid' ? Math.min(1.25, native) : 1
  return <Canvas shadows={tier !== 'low'} dpr={dpr} camera={{ position: HOME, fov: 35, near: .5, far: 220 }} frameloop={props.active ? props.still ? 'demand' : 'always' : 'never'} gl={{ antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05 }}>
    <color attach="background" args={['#f5f3fa']} /><fog attach="fog" args={['#f5f3fa', 30, 118]} />
    <ambientLight intensity={1.1} color="#ffffff" /><hemisphereLight args={['#ffffff', '#c9b9dc', .8]} />
    <directionalLight key={tier} position={[-4, 10, 4]} intensity={2.0} color="#ffffff" castShadow shadow-mapSize={tier === 'high' ? [2048, 2048] : [1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={10} shadow-camera-bottom={-9} shadow-normalBias={.025} shadow-bias={-.0004} />
    <pointLight position={[1, 3.1, 2.3]} color={PINK} intensity={1.5} distance={7} />
    <pointLight position={[4, 4.5, -1]} color="#c6b8ed" intensity={1.2} distance={8} />
    <Sky /><StreetBackdrop />
    <Bake>
      <Building onOpen={props.onOpen} still={props.still} /><Street onOpen={props.onOpen} onAbout={props.onAbout} /><StreetDetails still={props.still} />
      <RoadMarks /><LessonMachine onOpen={() => props.onOpen('lessons')} /><Postbox /><CurveMirror />
    </Bake>
    <Unreflected><Rain still={props.still} /><Ripples still={props.still} /></Unreflected>
    <CameraRig reset={props.reset} focus={props.focus} still={props.still} />
    {tier !== 'low' && <NeonBloom />}<ShadowBake tier={tier} />
    <FrameBudget onSlow={onSlow} active={props.active && !props.still && tier !== 'low'} limit={tier === 'high' ? 1 / 38 : 1 / 26} /><Lifecycle onReady={props.onReady} onFailure={props.onFailure} />
  </Canvas>
}
