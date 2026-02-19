import React from "react";

const US = ({ size = 16 }: { size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circular clip */}
      <defs>
        <clipPath id="us-flag-clip">
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath="url(#us-flag-clip)">
        {/* Red and white stripes */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <rect
            key={i}
            x="0"
            y={i * (64 / 13)}
            width="64"
            height={64 / 13}
            fill={i % 2 === 0 ? "#B22234" : "#FFFFFF"}
          />
        ))}
        {/* Blue canton */}
        <rect x="0" y="0" width="28" height={7 * (64 / 13)} fill="#3C3B6E" />
        {/* Simplified stars - 3x3 grid */}
        {[8, 14, 20].map((y) =>
          [6, 14, 22].map((x) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="white" />
          ))
        )}
        {[11, 17].map((y) =>
          [10, 18].map((x) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="white" />
          ))
        )}
      </g>
    </svg>
  );
};

export default US;
