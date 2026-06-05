import React from "react";

export const SpaceBackground: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#030506]">
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(180deg, rgba(5,9,9,0.98) 0%, rgba(3,5,6,1) 44%, rgba(1,2,3,1) 100%)",
      }}
    />
    <div
      className="absolute inset-0 opacity-80"
      style={{
        background:
          "linear-gradient(112deg, rgba(46,229,157,0) 0%, rgba(46,229,157,0.08) 48%, rgba(46,229,157,0) 82%)",
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, rgba(1,2,3,0.96) 0%, rgba(3,5,6,0.62) 48%, rgba(1,2,3,0.96) 100%)",
      }}
    />
    <svg className="absolute -left-8 -top-14 h-[300px] w-[300px] opacity-[0.035]" viewBox="0 0 140 150" fill="none" aria-hidden="true">
      <path
        d="M 105 130 L 105 45 A 42 42 0 1 0 105 112"
        stroke="#7cf3bd"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="105" cy="130" r="10" fill="#7cf3bd" />
    </svg>
    <svg className="absolute -right-20 top-[24vh] h-[520px] w-[520px] opacity-[0.045]" viewBox="0 0 140 150" fill="none" aria-hidden="true">
      <path
        d="M 105 130 L 105 45 A 42 42 0 1 0 105 112"
        stroke="#7cf3bd"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="105" cy="130" r="10" fill="#7cf3bd" />
    </svg>
    <div
      className="absolute inset-0 opacity-45"
      style={{
        backgroundImage:
          "radial-gradient(circle at 8% 22%, rgba(124,243,189,0.28) 0 1px, transparent 2px), radial-gradient(circle at 24% 72%, rgba(124,243,189,0.22) 0 1px, transparent 2px), radial-gradient(circle at 43% 17%, rgba(255,255,255,0.18) 0 1px, transparent 2px), radial-gradient(circle at 73% 84%, rgba(124,243,189,0.24) 0 1px, transparent 2px), radial-gradient(circle at 91% 12%, rgba(124,243,189,0.28) 0 1px, transparent 2px)",
      }}
    />
  </div>
);
