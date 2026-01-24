"use client"

/**
 * Atlas Thunder Centerpiece — Atlas the Titan bearing the celestial sphere,
 * with lightning crackling through the heavens. Myth + thunder theme.
 * Enhanced: rotating rings, richer sphere, lightning core, sparks, refined Atlas.
 */
export function AtlasThunderCenterpiece({
  className = "",
  size = 280,
}: {
  className?: string
  size?: number
}) {
  const cx = 100
  const cy = 100
  const r = 38

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_32px_rgba(129,140,248,0.45)]"
      >
        <defs>
          {/* Sphere: deeper gradient with inner highlight */}
          <radialGradient id="atlasSphereGrad" cx="0.32" cy="0.32" r="0.75">
            <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.5" />
            <stop offset="25%" stopColor="#818cf8" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#4338ca" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0.95" />
          </radialGradient>
          <linearGradient id="atlasLightningGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#facc15" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="atlasLightningCore" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#e9d5ff" />
          </linearGradient>
          <filter id="atlasLightningGlow">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="atlasSphereGlow">
            <feGaussianBlur stdDeviation="4" result="sblur" />
            <feFlood floodColor="#818cf8" floodOpacity="0.3" />
            <feComposite in2="sblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="atlasAuraGrad" cx="0.5" cy="0.5" r="0.65">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.25" />
            <stop offset="40%" stopColor="#a78bfa" stopOpacity="0.15" />
            <stop offset="70%" stopColor="#6366f1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="atlasTitanGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0c1222" />
            <stop offset="40%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>

        {/* Outer aura — layered */}
        <circle cx={cx} cy={cy} r={94} fill="url(#atlasAuraGrad)" style={{ animation: "atlasGlow 6s ease-in-out infinite alternate" }} />

        {/* Drifting spark particles */}
        {[
          { x: 45, y: 55, d: 0 },
          { x: 155, y: 50, d: 0.4 },
          { x: 50, y: 145, d: 0.2 },
          { x: 150, y: 152, d: 0.6 },
          { x: 100, y: 35, d: 0.3 },
          { x: 28, y: 98, d: 0.5 },
          { x: 172, y: 102, d: 0.15 },
        ].map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            fill="rgba(253,224,71,0.9)"
            style={{
              animation: `sparkle ${2.5 + (i % 3) * 0.5}s ease-in-out infinite, drift ${4 + (i % 2)}s ease-in-out infinite`,
              animationDelay: `${p.d}s, ${p.d * 2}s`,
              transformOrigin: `${p.x}px ${p.y}px`,
            }}
          />
        ))}

        {/* Lightning bolts around the scene */}
        <g filter="url(#atlasLightningGlow)" stroke="url(#atlasLightningGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ opacity: 0.92 }}>
          <path d="M 52 45 L 58 65 L 52 75 L 60 95 L 54 108" style={{ animation: "lightningFlash 2.2s ease-in-out infinite", animationDelay: "0s" }} />
          <path d="M 148 42 L 142 62 L 150 72 L 140 92 L 146 105" style={{ animation: "lightningFlash 2.5s ease-in-out infinite", animationDelay: "0.4s" }} />
          <path d="M 100 28 L 96 48 L 102 58 L 98 78 L 104 88" style={{ animation: "lightningFlash 2.8s ease-in-out infinite", animationDelay: "0.8s" }} />
          <path d="M 68 155 L 74 135 L 68 125 L 76 105 L 70 92" style={{ animation: "lightningFlash 2.3s ease-in-out infinite", animationDelay: "0.2s" }} />
          <path d="M 132 158 L 126 138 L 132 128 L 124 108 L 130 94" style={{ animation: "lightningFlash 2.6s ease-in-out infinite", animationDelay: "0.6s" }} />
          <path d="M 30 98 L 42 102 L 38 118 L 48 128 L 42 145" style={{ animation: "lightningFlash 2.4s ease-in-out infinite", animationDelay: "0.3s" }} />
          <path d="M 170 100 L 158 104 L 162 120 L 152 130 L 158 146" style={{ animation: "lightningFlash 2.7s ease-in-out infinite", animationDelay: "0.5s" }} />
          <path d="M 75 42 L 82 58 L 78 68 L 86 82" style={{ animation: "lightningFlash 2.35s ease-in-out infinite", animationDelay: "0.15s" }} />
          <path d="M 125 38 L 118 54 L 124 66 L 116 80" style={{ animation: "lightningFlash 2.55s ease-in-out infinite", animationDelay: "0.55s" }} />
          <path d="M 90 162 L 96 148 L 90 138 L 98 122" style={{ animation: "lightningFlash 2.45s ease-in-out infinite", animationDelay: "0.35s" }} />
        </g>

        {/* Atlas silhouette — refined pose, holding the heavens */}
        <g fill="url(#atlasTitanGrad)">
          <ellipse cx={cx} cy={172} rx={52} ry={7} />
          <path d="M 72 172 L 74 155 L 81 151 L 84 172 Z" />
          <path d="M 128 172 L 126 155 L 119 151 L 116 172 Z" />
          <path d="M 81 151 L 119 151 L 115 122 L 85 122 Z" />
          {/* Left arm — curved, cradling */}
          <path d="M 85 122 Q 62 105 64 88 Q 66 76 78 72 L 82 95 Q 80 108 85 122 Z" />
          <path d="M 115 122 Q 138 105 136 88 Q 134 76 122 72 L 118 95 Q 120 108 115 122 Z" />
          <ellipse cx={cx} cy={106} rx={11} ry={13} />
        </g>
        {/* Celestial rings — rotating */}
        <g style={{ transformOrigin: "100px 100px", animation: "ringSpin 24s linear infinite" }}>
          <ellipse cx={cx} cy={cy} rx={r + 14} ry={(r + 14) * 0.35} fill="none" stroke="rgba(129,140,248,0.35)" strokeWidth="1.5" transform={`rotate(-25 ${cx} ${cy})`} />
        </g>
        <g style={{ transformOrigin: "100px 100px", animation: "ringSpinReverse 18s linear infinite" }}>
          <ellipse cx={cx} cy={cy} rx={r + 8} ry={(r + 8) * 0.4} fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1" transform={`rotate(15 ${cx} ${cy})`} />
        </g>
        <g style={{ transformOrigin: "100px 100px", animation: "ringSpin 30s linear infinite" }}>
          <ellipse cx={cx} cy={cy} rx={r + 20} ry={(r + 20) * 0.28} fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="1" transform={`rotate(5 ${cx} ${cy})`} />
        </g>

        {/* Celestial sphere — weight of the sky, with glow */}
        <g filter="url(#atlasSphereGlow)">
          <circle cx={cx} cy={cy} r={r} fill="url(#atlasSphereGrad)" style={{ animation: "spherePulse 5s ease-in-out infinite" }} />
        </g>
        {/* Constellation detail — more stars */}
        <g stroke="rgba(255,255,255,0.28)" strokeWidth="0.75" fill="none">
          <path d={`M ${cx - 14} ${cy - 6} L ${cx + 2} ${cy + 8} L ${cx + 16} ${cy - 2}`} />
          <path d={`M ${cx - 8} ${cy + 12} L ${cx + 6} ${cy + 4}`} />
          <path d={`M ${cx - 4} ${cy - 14} L ${cx + 10} ${cy - 10}`} />
          {[
            [cx - 14, cy - 6],
            [cx + 2, cy + 8],
            [cx + 16, cy - 2],
            [cx - 8, cy + 12],
            [cx + 6, cy + 4],
            [cx - 4, cy - 14],
            [cx + 10, cy - 10],
            [cx + 12, cy + 10],
            [cx - 10, cy + 4],
          ].map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={i < 3 ? 1.6 : 1} fill="rgba(255,255,255,0.7)" />
          ))}
        </g>

        {/* Atmosphere halo */}
        <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="rgba(199,210,254,0.2)" strokeWidth="2" style={{ animation: "atlasGlow 4s ease-in-out infinite alternate" }} />

        {/* Lightning through the sphere — core + main */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path
            d={`M ${cx - 20} ${cy - 35} L ${cx - 4} ${cy} L ${cx + 18} ${cy + 32}`}
            stroke="url(#atlasLightningGrad)"
            strokeWidth="2.5"
            opacity="0.9"
            style={{ animation: "lightningFlash 2s ease-in-out infinite", animationDelay: "0.1s" }}
          />
          <path
            d={`M ${cx - 20} ${cy - 35} L ${cx - 4} ${cy} L ${cx + 18} ${cy + 32}`}
            stroke="url(#atlasLightningCore)"
            strokeWidth="1"
            opacity="0.95"
            style={{ animation: "lightningFlash 2s ease-in-out infinite", animationDelay: "0.1s" }}
          />
          <path
            d={`M ${cx + 22} ${cy - 30} L ${cx + 6} ${cy + 4} L ${cx - 16} ${cy + 38}`}
            stroke="url(#atlasLightningGrad)"
            strokeWidth="2.2"
            opacity="0.8"
            style={{ animation: "lightningFlash 2.2s ease-in-out infinite", animationDelay: "0.5s" }}
          />
          <path
            d={`M ${cx + 22} ${cy - 30} L ${cx + 6} ${cy + 4} L ${cx - 16} ${cy + 38}`}
            stroke="url(#atlasLightningCore)"
            strokeWidth="0.9"
            opacity="0.9"
            style={{ animation: "lightningFlash 2.2s ease-in-out infinite", animationDelay: "0.5s" }}
          />
        </g>
      </svg>
    </div>
  )
}
