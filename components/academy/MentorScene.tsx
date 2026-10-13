"use client"

import { useId } from 'react'
import type { MentorId } from '@/lib/academy'
import { useAcademyLocale } from './useAcademyLocale'

/** Original vector artwork; shared scenery keeps every story beat visually consistent. */
export function MentorScene({ mentor = 'value', compact = false }: { mentor?: MentorId; compact?: boolean }) {
  const id = useId().replace(/:/g, '')
  const value = mentor === 'value'
  const { tr } = useAcademyLocale()
  return <div className={`mentor-scene ${compact ? 'mentor-scene-compact' : ''}`}>
    <svg viewBox="0 0 900 700" role="img" aria-label={value ? tr("价值投资导师坐在窗前的绿色书房里", "A value investing mentor by the window in a green study") : tr("量化专家在书房里展示研究笔记", "A quant mentor presenting research notes in the study")}>
      <defs>
        <linearGradient id={`${id}-wall`} x2="0" y2="1"><stop stopColor="#244e43" /><stop offset="1" stopColor="#16382f" /></linearGradient>
        <linearGradient id={`${id}-window`} x2="0" y2="1"><stop stopColor="#e8d9b6" /><stop offset="1" stopColor="#9bbfb0" /></linearGradient>
        <linearGradient id={`${id}-desk`} x2="0" y2="1"><stop stopColor="#bb8960" /><stop offset="1" stopColor="#8c6247" /></linearGradient>
        <pattern id={`${id}-grain`} width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#fff" opacity=".06" /></pattern>
        <clipPath id={`${id}-arch`}><path d="M255 425V220a137 137 0 0 1 274 0v205Z" /></clipPath>
      </defs>
      <rect width="900" height="700" fill={`url(#${id}-wall)`} />
      <rect width="900" height="700" fill={`url(#${id}-grain)`} />
      <path d="M0 552H900V700H0Z" fill="#18382e" />
      <path d="M0 552H900M0 572H900" stroke="#709080" strokeOpacity=".25" />
      <path d="M237 439V220a155 155 0 0 1 310 0v219Z" fill="#668576" />
      <g clipPath={`url(#${id}-arch)`}>
        <rect x="250" y="65" width="290" height="370" fill={`url(#${id}-window)`} />
        <circle className="scene-sun" cx="455" cy="180" r="43" fill="#fff0c3" />
        <path d="M250 320L305 287L364 314L432 263L543 321V450H250Z" fill="#83a396" />
        <path d="M250 369L324 330L409 368L490 326L550 342V450H250Z" fill="#608d7c" />
        <path d="M292 360V285M278 308L292 289L310 312M475 362V273M451 311L475 281L497 311" fill="none" stroke="#476e5d" strokeWidth="8" />
        <path d="M255 242H530M391 74V430" stroke="#648777" strokeWidth="9" />
      </g>
      <path d="M227 440H557" stroke="#98ac93" strokeWidth="12" />
      <g fill="#112d26"><rect x="58" y="186" width="132" height="16" rx="3" /><rect x="58" y="316" width="132" height="16" rx="3" /></g>
      <g transform="translate(70 100)"><rect width="19" height="86" rx="2" fill="#d7bc86" /><rect x="24" y="17" width="23" height="69" rx="2" fill="#9baf91" /><path d="M58 4L83 0L96 82L71 86Z" fill="#b87556" /><path d="M4 14H15M28 32H42M4 68H15" stroke="#4d6854" strokeWidth="3" /></g>
      <g transform="translate(80 240)"><path d="M0 32Q-22-6 8 0Q31 12 15 40Q25-9 47 3Q55 25 22 44" fill="#8da77e" /><path d="M0 43H36L31 74H5Z" fill="#d2b082" /><rect x="66" y="25" width="18" height="50" fill="#759483" /></g>
      <g transform="translate(613 143) rotate(3)"><rect width="211" height="170" rx="5" fill="#b29768" /><rect x="8" y="8" width="195" height="154" rx="2" fill="#193b32" /><path d="M35 125H177M35 125V43" fill="none" stroke="#87a88c" strokeWidth="2" /><path className="scene-chart" d={value ? 'M43 113L69 104L95 110L121 77L143 80L171 47' : 'M43 100L64 80L88 100L111 65L140 80L170 44'} fill="none" stroke="#dabb7c" strokeWidth="4" strokeLinecap="round" /><circle cx="171" cy={value ? 47 : 44} r="5" fill="#e2cf9f" /></g>
      <g className="scene-leaf" transform="translate(730 400)"><path d="M32 161Q30 71 3 22M32 123Q65 43 90 26" fill="none" stroke="#6f9267" strokeWidth="6" /><ellipse cx="4" cy="35" rx="20" ry="47" transform="rotate(-30 4 35)" fill="#8faa7c" /><ellipse cx="70" cy="71" rx="20" ry="45" transform="rotate(40 70 71)" fill="#9fb28a" /><ellipse cx="25" cy="91" rx="18" ry="38" transform="rotate(-35 25 91)" fill="#6f956d" /><path d="M0 145H74L61 219H13Z" fill="#c99c72" /><path d="M3 156H72" stroke="#ddb68a" strokeWidth="8" /></g>
      <ellipse cx="420" cy="621" rx="272" ry="28" fill="#0a241d" opacity=".4" />
      <path d="M297 527V381Q297 327 350 327H499Q546 327 546 381V527Z" fill="#91704b" /><path d="M309 527V385Q309 343 351 343H492Q532 343 532 385V527Z" fill="#bf9a67" />
      <g className="scene-person" key={mentor}>
        <path d="M341 491L326 650H385L416 512L447 650H505L486 484Z" fill="#223336" />
        <path d="M327 641H385V660H310Q306 646 327 641M448 641H503Q526 645 525 660H448Z" fill="#122722" />
        <path d="M344 363Q314 370 301 412L280 486L322 499L345 438L341 512H492L487 443L522 491L553 464L519 398Q507 368 469 360Z" fill={value ? '#384d50' : '#c9b88e'} />
        <path d="M374 361L416 468L458 361Z" fill={value ? '#f5ead4' : '#234b42'} />
        {value && <><path d="M411 388L423 388L433 443L417 466L403 441Z" fill="#bd8263" /><path d="M374 360L353 397L379 403L366 422L415 489M458 360L480 397L456 403L468 422L417 489" fill="none" stroke="#64807a" strokeWidth="3" /></>}
        <path d="M396 332V367Q417 388 440 365V330Z" fill="#d3a47d" />
        <ellipse cx="417" cy="276" rx="64" ry="77" fill="#e5bf98" />
        <ellipse cx="353" cy="283" rx="11" ry="18" fill="#dfb28b" /><ellipse cx="480" cy="283" rx="11" ry="18" fill="#dfb28b" />
        {value ? <><path d="M354 278Q328 213 382 199Q424 169 470 205Q498 224 480 280L471 240Q446 237 453 214Q415 242 368 228Z" fill="#e3e5d7" /><path d="M365 216Q402 190 441 206" fill="none" stroke="#f7f1df" strokeWidth="8" strokeLinecap="round" /><path d="M360 263H402Q409 264 409 275V286Q406 301 386 301Q366 301 363 284ZM425 263H470L467 285Q464 301 445 301Q425 301 424 286V275Q423 266 425 263Z" fill="#d2b792" fillOpacity=".3" stroke="#33423b" strokeWidth="5" /><path d="M409 273H424" stroke="#33423b" strokeWidth="5" /></> : <><path d="M354 279Q335 232 364 209Q391 181 442 196Q494 203 482 274L466 242Q433 250 414 224Q395 247 365 247Z" fill="#203a32" /><path d="M371 213Q407 191 441 210" fill="none" stroke="#47604a" strokeWidth="7" strokeLinecap="round" /></>}
        <g className="scene-eyes" fill="#283b32"><ellipse cx="387" cy="279" rx="4" ry="5" /><ellipse cx="447" cy="279" rx="4" ry="5" /></g>
        <path d="M416 282L410 302H422" fill="none" stroke="#c4916c" strokeWidth="3" strokeLinecap="round" /><path d="M396 317Q417 331 438 317" fill="none" stroke="#8e6350" strokeWidth="3" strokeLinecap="round" />
        <path d="M281 483Q284 460 305 465L340 481L327 501Z" fill="#e5bf98" /><path d="M521 473Q532 458 547 466L569 488L548 505Z" fill="#e5bf98" />
        {!value && <g transform="translate(470 412) rotate(-13)"><rect width="81" height="111" rx="6" fill="#244b40" stroke="#749681" strokeWidth="3" /><path d="M15 82L29 63L42 72L59 39M15 23H63" stroke="#dabb7c" strokeWidth="3" fill="none" /></g>}
      </g>
      <path d="M157 526H642L668 558H130Z" fill={`url(#${id}-desk)`} /><path d="M130 558H668V578H130Z" fill="#72533c" /><path d="M170 574V687M626 574V687" stroke="#866245" strokeWidth="18" />
      <g transform="translate(336 525)"><path d="M0 0L53-13L91 4L41 16Z" fill="#f0e4c7" /><path d="M43 12L53-9M11 0L38-6M14 5L35 0M59-3L77 3" stroke="#a29a7e" strokeWidth="2" /></g>
      <g transform="translate(534 494)"><path d="M7 7H48V32Q25 44 7 32Z" fill="#e7d9b6" /><path d="M48 11Q73 7 63 25Q60 31 48 27" fill="none" stroke="#e7d9b6" strokeWidth="6" /><ellipse cx="27" cy="7" rx="20" ry="5" fill="#694d36" /><path className="scene-steam" d="M22-4Q13-13 23-25M37-4Q29-16 39-29" fill="none" stroke="#e7d9b6" strokeWidth="3" strokeLinecap="round" /></g>
      <g transform="translate(163 487)"><path d="M0 22L76 18L86 29L8 34Z" fill="#b9c6a4" /><path d="M0 11L67 6L76 18L0 22Z" fill="#294f44" /><path d="M6 0L66-3L67 6L0 11Z" fill="#d8b376" /></g>
    </svg>
  </div>
}
