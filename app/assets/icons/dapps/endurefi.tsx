import React from "react";

const EndureFi = ({ size = 16 }: { size?: number }) => {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="1" stopColor="#065f46" />
        </linearGradient>
      </defs>
      {/* Circle background */}
      <circle cx="32" cy="32" r="32" fill={`url(#${id}-bg)`} />
      {/* Swoosh / leaf shape */}
      <path
        d="M16 38c4-14 18-22 32-20-2 10-10 20-22 22-4 1-8 0-10-2z"
        fill="#34d399"
        opacity="0.9"
      />
      <path
        d="M18 36c3-10 14-18 26-17-1 8-8 16-18 18-3 .6-6 .2-8-1z"
        fill="#6ee7b7"
        opacity="0.5"
      />
      {/* Sparkle top-right */}
      <circle cx="42" cy="18" r="1.8" fill="white" opacity="0.9" />
      <line x1="42" y1="14.5" x2="42" y2="21.5" stroke="white" strokeWidth="0.8" opacity="0.7" />
      <line x1="38.5" y1="18" x2="45.5" y2="18" stroke="white" strokeWidth="0.8" opacity="0.7" />
      {/* Small sparkle */}
      <circle cx="35" cy="24" r="1" fill="white" opacity="0.7" />
      {/* Dot bottom */}
      <circle cx="44" cy="38" r="2.5" fill="white" opacity="0.85" />
    </svg>
  );
};

export default EndureFi;
