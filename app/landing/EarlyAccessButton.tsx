"use client";

import { useState } from "react";

const tones = {
  light: {
    button: "bg-[#059669] text-white shadow-[0_10px_30px_rgba(5,150,105,0.22)] hover:bg-[#047857]",
    message: "text-[#047857]",
  },
  dark: {
    button: "bg-[#2ee59d] text-[#04231a] hover:bg-[#6fdcb4]",
    message: "text-[#2ee59d]",
  },
};

export function EarlyAccessButton({ tone = "light" }: { tone?: keyof typeof tones }) {
  const [announced, setAnnounced] = useState(false);
  const style = tones[tone];

  return (
    <div>
      <button
        type="button"
        onClick={() => setAnnounced(true)}
        className={`rounded-lg px-7 py-3.5 font-mono text-[12px] font-semibold tracking-[0.16em] transition ${style.button}`}
      >
        GET EARLY ACCESS
      </button>
      {/* Kept in the layout at all times so revealing it shifts nothing. */}
      <p
        aria-live="polite"
        className={`mt-3 font-mono text-[11px] tracking-[0.18em] ${style.message} ${
          announced ? "" : "invisible"
        }`}
      >
        MARKETS OPENING SOON
      </p>
    </div>
  );
}
