type OrbSpec = { className: string; style: React.CSSProperties }

export function Orbs({ variant = "default" }: { variant?: "default" | "soft" | "hot" | "cool" }) {
  const orbs: OrbSpec[] =
    variant === "hot"
      ? [
          { className: "orb orb-magenta orb-float", style: { width: 520, height: 520, top: -120, left: -80 } },
          { className: "orb orb-amber orb-float",   style: { width: 440, height: 440, top: 80,  right: -60, animationDelay: "-4s" } },
          { className: "orb orb-pink orb-float",    style: { width: 360, height: 360, bottom: -120, left: "40%", animationDelay: "-8s" } },
        ]
      : variant === "cool"
        ? [
            { className: "orb orb-cyan orb-float",   style: { width: 500, height: 500, top: -80, left: "15%" } },
            { className: "orb orb-purple orb-float", style: { width: 420, height: 420, bottom: -100, right: "10%", animationDelay: "-6s" } },
          ]
        : variant === "soft"
          ? [
              { className: "orb orb-green orb-float", style: { width: 420, height: 420, top: -60, right: -60, opacity: 0.35 } },
              { className: "orb orb-purple orb-float", style: { width: 380, height: 380, bottom: -80, left: -60, opacity: 0.35, animationDelay: "-7s" } },
            ]
          : [
              { className: "orb orb-green orb-float",   style: { width: 560, height: 560, top: -140, left: -100 } },
              { className: "orb orb-cyan orb-float",    style: { width: 460, height: 460, top: 120, right: -120, animationDelay: "-5s" } },
              { className: "orb orb-magenta orb-float", style: { width: 380, height: 380, bottom: -60, left: "40%", animationDelay: "-9s" } },
              { className: "orb orb-purple orb-float",  style: { width: 320, height: 320, bottom: 80, right: "30%", animationDelay: "-3s" } },
            ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((o, i) => (
        <div key={i} className={o.className} style={o.style} />
      ))}
      <div className="absolute inset-0 dotted-ring opacity-[0.08]" />
    </div>
  )
}
