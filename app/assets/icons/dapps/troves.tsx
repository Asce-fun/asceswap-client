import React from "react";

const Troves = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      width={size * 2.5}
      height={size}
      viewBox="0 0 160 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="80"
        y="48"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="52"
        fill="#8b5cf6"
      >
        Troves
      </text>
    </svg>
  );
};

export default Troves;
