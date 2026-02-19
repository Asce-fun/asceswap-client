import React from "react";

export const SpaceBackground: React.FC = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
    <svg width="100%" height="100%" viewBox="0 0 1500 900" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="nebula1" cx="70%" cy="25%" r="40%">
          <stop offset="0" stopColor="#064e3b" stopOpacity="0.3"/>
          <stop offset="0.5" stopColor="#059669" stopOpacity="0.08"/>
          <stop offset="1" stopColor="#030305" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="nebula2" cx="25%" cy="65%" r="35%">
          <stop offset="0" stopColor="#059669" stopOpacity="0.12"/>
          <stop offset="0.6" stopColor="#064e3b" stopOpacity="0.04"/>
          <stop offset="1" stopColor="#030305" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="nebula3" cx="85%" cy="70%" r="25%">
          <stop offset="0" stopColor="#34d399" stopOpacity="0.06"/>
          <stop offset="1" stopColor="#030305" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="nebula4" cx="10%" cy="15%" r="22%">
          <stop offset="0" stopColor="#6ee7b7" stopOpacity="0.04"/>
          <stop offset="1" stopColor="#030305" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="coreGlow" cx="50%" cy="35%" r="30%">
          <stop offset="0" stopColor="#34d399" stopOpacity="0.08"/>
          <stop offset="0.4" stopColor="#059669" stopOpacity="0.04"/>
          <stop offset="1" stopColor="#030305" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="logoGrad" x1="1200" y1="700" x2="1060" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#064e3b" stopOpacity="0.15"/>
          <stop offset="0.35" stopColor="#059669" stopOpacity="0.12"/>
          <stop offset="0.65" stopColor="#34d399" stopOpacity="0.08"/>
          <stop offset="1" stopColor="#6ee7b7" stopOpacity="0.05"/>
        </linearGradient>
        <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="brightStar" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.04"/></feComponentTransfer>
          <feBlend in="SourceGraphic" mode="screen"/>
        </filter>
      </defs>

      {/* Deep space base */}
      <rect width="1500" height="900" fill="#030305"/>

      {/* Nebula layers */}
      <rect width="1500" height="900" fill="url(#nebula1)"/>
      <rect width="1500" height="900" fill="url(#nebula2)"/>
      <rect width="1500" height="900" fill="url(#nebula3)"/>
      <rect width="1500" height="900" fill="url(#nebula4)"/>
      <rect width="1500" height="900" fill="url(#coreGlow)"/>

      {/* Tiny distant stars */}
      <circle cx="45" cy="32" r="0.5" fill="#e8e6ee" opacity="0.15"/>
      <circle cx="120" cy="85" r="0.4" fill="#e8e6ee" opacity="0.12"/>
      <circle cx="198" cy="18" r="0.6" fill="#e8e6ee" opacity="0.18"/>
      <circle cx="310" cy="55" r="0.5" fill="#e8e6ee" opacity="0.14"/>
      <circle cx="420" cy="30" r="0.5" fill="#e8e6ee" opacity="0.16"/>
      <circle cx="555" cy="45" r="0.5" fill="#e8e6ee" opacity="0.13"/>
      <circle cx="680" cy="22" r="0.5" fill="#e8e6ee" opacity="0.15"/>
      <circle cx="810" cy="60" r="0.5" fill="#e8e6ee" opacity="0.14"/>
      <circle cx="940" cy="35" r="0.5" fill="#e8e6ee" opacity="0.16"/>
      <circle cx="1080" cy="50" r="0.5" fill="#e8e6ee" opacity="0.13"/>
      <circle cx="1220" cy="28" r="0.5" fill="#e8e6ee" opacity="0.15"/>
      <circle cx="1355" cy="42" r="0.5" fill="#e8e6ee" opacity="0.14"/>
      <circle cx="1470" cy="65" r="0.5" fill="#e8e6ee" opacity="0.13"/>
      <circle cx="75" cy="290" r="0.6" fill="#e8e6ee" opacity="0.2"/>
      <circle cx="230" cy="210" r="0.7" fill="#e8e6ee" opacity="0.15"/>
      <circle cx="450" cy="240" r="0.6" fill="#e8e6ee" opacity="0.2"/>
      <circle cx="640" cy="180" r="0.6" fill="#e8e6ee" opacity="0.18"/>
      <circle cx="850" cy="210" r="0.7" fill="#e8e6ee" opacity="0.2"/>
      <circle cx="1050" cy="250" r="0.6" fill="#e8e6ee" opacity="0.19"/>
      <circle cx="1250" cy="190" r="0.6" fill="#e8e6ee" opacity="0.2"/>
      <circle cx="155" cy="480" r="0.5" fill="#e8e6ee" opacity="0.18"/>
      <circle cx="340" cy="420" r="0.5" fill="#e8e6ee" opacity="0.17"/>
      <circle cx="530" cy="360" r="0.5" fill="#e8e6ee" opacity="0.14"/>
      <circle cx="760" cy="440" r="0.5" fill="#e8e6ee" opacity="0.16"/>
      <circle cx="960" cy="400" r="0.5" fill="#e8e6ee" opacity="0.15"/>
      <circle cx="1160" cy="430" r="0.5" fill="#e8e6ee" opacity="0.14"/>
      <circle cx="1350" cy="370" r="0.5" fill="#e8e6ee" opacity="0.16"/>
      <circle cx="100" cy="650" r="0.5" fill="#e8e6ee" opacity="0.12"/>
      <circle cx="380" cy="600" r="0.5" fill="#e8e6ee" opacity="0.15"/>
      <circle cx="600" cy="580" r="0.5" fill="#e8e6ee" opacity="0.13"/>
      <circle cx="820" cy="620" r="0.5" fill="#e8e6ee" opacity="0.16"/>
      <circle cx="1100" cy="590" r="0.5" fill="#e8e6ee" opacity="0.14"/>
      <circle cx="1380" cy="560" r="0.5" fill="#e8e6ee" opacity="0.12"/>
      <circle cx="260" cy="750" r="0.5" fill="#e8e6ee" opacity="0.15"/>
      <circle cx="500" cy="780" r="0.5" fill="#e8e6ee" opacity="0.13"/>
      <circle cx="740" cy="730" r="0.5" fill="#e8e6ee" opacity="0.17"/>
      <circle cx="980" cy="770" r="0.5" fill="#e8e6ee" opacity="0.14"/>
      <circle cx="1200" cy="740" r="0.5" fill="#e8e6ee" opacity="0.16"/>
      <circle cx="1440" cy="710" r="0.5" fill="#e8e6ee" opacity="0.11"/>
      <circle cx="180" cy="860" r="0.5" fill="#e8e6ee" opacity="0.13"/>
      <circle cx="650" cy="840" r="0.5" fill="#e8e6ee" opacity="0.15"/>
      <circle cx="1050" cy="850" r="0.5" fill="#e8e6ee" opacity="0.12"/>
      <circle cx="1300" cy="830" r="0.5" fill="#e8e6ee" opacity="0.14"/>

      {/* Bright stars with glow + twinkle */}
      <circle className="tw1" cx="220" cy="70" r="1.2" fill="#6ee7b7" opacity="0.5" filter="url(#starGlow)"/>
      <circle className="tw2" cx="580" cy="130" r="1" fill="#e8e6ee" opacity="0.6" filter="url(#starGlow)"/>
      <circle className="tw3" cx="890" cy="80" r="1.5" fill="#34d399" opacity="0.4" filter="url(#starGlow)"/>
      <circle className="tw1" cx="1180" cy="90" r="1" fill="#e8e6ee" opacity="0.5" filter="url(#starGlow)"/>
      <circle className="tw2" cx="1380" cy="140" r="1.2" fill="#6ee7b7" opacity="0.35" filter="url(#starGlow)"/>
      <circle className="tw3" cx="350" cy="350" r="1" fill="#e8e6ee" opacity="0.45" filter="url(#starGlow)"/>
      <circle className="tw1" cx="720" cy="300" r="1.3" fill="#34d399" opacity="0.3" filter="url(#starGlow)"/>
      <circle className="tw2" cx="1100" cy="420" r="1" fill="#e8e6ee" opacity="0.4" filter="url(#starGlow)"/>
      <circle className="tw3" cx="480" cy="540" r="1" fill="#34d399" opacity="0.35" filter="url(#starGlow)"/>
      <circle className="tw1" cx="150" cy="500" r="1.2" fill="#e8e6ee" opacity="0.4" filter="url(#starGlow)"/>
      <circle className="tw2" cx="1320" cy="560" r="1.2" fill="#6ee7b7" opacity="0.3" filter="url(#starGlow)"/>
      <circle className="tw3" cx="900" cy="650" r="1" fill="#e8e6ee" opacity="0.35" filter="url(#starGlow)"/>
      <circle className="tw1" cx="300" cy="750" r="1.2" fill="#34d399" opacity="0.3" filter="url(#starGlow)"/>
      <circle className="tw2" cx="1200" cy="780" r="1" fill="#6ee7b7" opacity="0.35" filter="url(#starGlow)"/>

      {/* Feature bright stars */}
      <circle className="tw2" cx="1050" cy="55" r="2" fill="#6ee7b7" opacity="0.6" filter="url(#brightStar)"/>
      <circle className="tw3" cx="650" cy="250" r="1.8" fill="#34d399" opacity="0.45" filter="url(#brightStar)"/>
      <circle className="tw1" cx="150" cy="200" r="1.5" fill="#e8e6ee" opacity="0.5" filter="url(#brightStar)"/>
      <circle className="tw2" cx="400" cy="680" r="1.6" fill="#6ee7b7" opacity="0.4" filter="url(#brightStar)"/>
      <circle className="tw3" cx="1100" cy="700" r="1.8" fill="#34d399" opacity="0.35" filter="url(#brightStar)"/>

      {/* Orbital rings */}
      <ellipse cx="750" cy="400" rx="400" ry="100" stroke="#34d399" strokeWidth="0.5" fill="none" opacity="0.04" transform="rotate(-8, 750, 400)"/>
      <ellipse cx="750" cy="400" rx="520" ry="140" stroke="#6ee7b7" strokeWidth="0.3" fill="none" opacity="0.03" transform="rotate(-8, 750, 400)"/>
      <ellipse cx="750" cy="400" rx="660" ry="185" stroke="#059669" strokeWidth="0.3" fill="none" opacity="0.025" transform="rotate(-8, 750, 400)"/>

      {/* Watermark 'a' — bottom right */}
      <g transform="translate(980, 200) scale(4)">
        <path d="M 105 130 L 105 45 A 42 42 0 1 0 105 112" stroke="url(#logoGrad)" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="105" cy="130" r="6" fill="#064e3b" opacity="0.1"/>
        <circle cx="105" cy="130" r="2.5" fill="#030305" opacity="0.12"/>
      </g>

      {/* Ghost 'a' — top left */}
      <g transform="translate(60, 50) scale(1.8)" opacity="0.03">
        <path d="M 105 130 L 105 45 A 42 42 0 1 0 105 112" stroke="#6ee7b7" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Grain texture */}
      <rect width="1500" height="900" filter="url(#noise)" opacity="0.4"/>
    </svg>
  </div>
);
