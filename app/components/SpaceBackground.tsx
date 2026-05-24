import React from "react";

export const SpaceBackground: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 bg-[#080b0f]">
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(180deg, rgba(12,18,23,0.98) 0%, rgba(8,11,15,1) 38%, rgba(8,11,15,1) 100%)",
      }}
    />
    <div
      className="absolute inset-0 opacity-25"
      style={{
        backgroundImage:
          "linear-gradient(rgba(76,141,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(76,141,255,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, rgba(8,11,15,0.96) 0%, rgba(8,11,15,0.42) 48%, rgba(8,11,15,0.96) 100%)",
      }}
    />
  </div>
);
