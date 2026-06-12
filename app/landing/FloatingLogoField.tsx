"use client";

import { useRef, useState } from "react";

const marks = [
  { x: 62, y: 30, size: 210, opacity: 0.09, delay: "-1s", force: 24 },
  { x: 82, y: 48, size: 118, opacity: 0.14, delay: "-5s", force: 34 },
  { x: 52, y: 62, size: 92, opacity: 0.12, delay: "-8s", force: 30 },
  { x: 78, y: 74, size: 150, opacity: 0.08, delay: "-3s", force: 22 },
  { x: 39, y: 42, size: 64, opacity: 0.16, delay: "-11s", force: 38 },
  { x: 93, y: 27, size: 72, opacity: 0.1, delay: "-14s", force: 26 },
];

function BrandMark({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 140 150" fill="none" aria-hidden="true" className="h-full w-full">
      <defs>
        <linearGradient id={id} x1="105" y1="130" x2="40" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#064e3b" />
          <stop offset="0.35" stopColor="#059669" />
          <stop offset="0.65" stopColor="#34d399" />
          <stop offset="1" stopColor="#6ee7b7" />
        </linearGradient>
      </defs>
      <path
        d="M 105 130 L 105 45 A 42 42 0 1 0 105 112"
        stroke={`url(#${id})`}
        strokeWidth="16"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="105" cy="130" r="6" fill="#064e3b" />
      <circle cx="105" cy="130" r="2.5" fill="#0e0e13" />
    </svg>
  );
}

export function FloatingLogoField() {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5, active: false });

  return (
    <div
      ref={fieldRef}
      className="pointer-events-auto absolute bottom-10 right-[-5rem] top-20 hidden w-[48vw] max-w-[42rem] lg:block"
      aria-hidden="true"
      onPointerMove={(event) => {
        const bounds = fieldRef.current?.getBoundingClientRect();
        if (!bounds) return;
        setPointer({
          x: (event.clientX - bounds.left) / bounds.width,
          y: (event.clientY - bounds.top) / bounds.height,
          active: true,
        });
      }}
      onPointerLeave={() => setPointer((current) => ({ ...current, active: false }))}
    >
      {marks.map((mark, index) => {
        const dx = mark.x / 100 - pointer.x;
        const dy = mark.y / 100 - pointer.y;
        const distance = Math.hypot(dx, dy);
        const influence = pointer.active ? Math.max(0, 1 - distance * 2.1) : 0;
        const pushX = dx * mark.force * influence;
        const pushY = dy * mark.force * influence;

        return (
          <div
            key={`${mark.x}-${mark.y}`}
            className="absolute transition-transform duration-300 ease-out"
            style={{
              left: `${mark.x}%`,
              top: `${mark.y}%`,
              width: mark.size,
              height: mark.size,
              opacity: mark.opacity,
              transform: `translate3d(calc(-50% + ${pushX.toFixed(2)}px), calc(-50% + ${pushY.toFixed(2)}px), 0)`,
            }}
          >
            <div className="hero-logo-float h-full w-full" style={{ animationDelay: mark.delay }}>
              <BrandMark id={`heroLogoGradient${index}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
