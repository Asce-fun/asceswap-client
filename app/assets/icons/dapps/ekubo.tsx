import React from "react";

const Ekubo = ({ size = 16 }: { size?: number }) => {
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
          <stop stopColor="#4c1d95" />
          <stop offset="1" stopColor="#3b0764" />
        </linearGradient>
      </defs>
      {/* Circle background */}
      <circle cx="32" cy="32" r="32" fill={`url(#${id}-bg)`} />
      {/* Two white circles (binocular/infinity icon) */}
      <circle cx="22" cy="32" r="9" fill="white" />
      <circle cx="42" cy="32" r="9" fill="white" />
    </svg>
  );
};

export default Ekubo;
