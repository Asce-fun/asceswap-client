import React from "react";

export const SpaceBackground: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--terminal-bg)]">
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(180deg, #e3eee8 0%, #eef6f1 42%, #f7fbf9 100%)",
      }}
    />
    <div
      className="absolute inset-0 opacity-70"
      style={{
        background:
          "linear-gradient(112deg, rgba(5,150,105,0) 0%, rgba(5,150,105,0.08) 46%, rgba(5,150,105,0) 82%)",
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, rgba(227,238,232,0.86) 0%, rgba(247,251,249,0.44) 48%, rgba(227,238,232,0.76) 100%)",
      }}
    />
    <svg className="absolute -left-8 -top-14 h-[300px] w-[300px] opacity-[0.035]" viewBox="0 0 140 150" fill="none" aria-hidden="true">
      <path
        d="M 105 130 L 105 45 A 42 42 0 1 0 105 112"
        stroke="#047857"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="105" cy="130" r="10" fill="#047857" />
      <circle cx="105" cy="130" r="4" fill="#0e0e13" />
    </svg>
    <svg className="absolute -right-20 top-[24vh] h-[520px] w-[520px] opacity-[0.045]" viewBox="0 0 140 150" fill="none" aria-hidden="true">
      <path
        d="M 105 130 L 105 45 A 42 42 0 1 0 105 112"
        stroke="#047857"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="105" cy="130" r="10" fill="#047857" />
      <circle cx="105" cy="130" r="4" fill="#0e0e13" />
    </svg>
  </div>
);
