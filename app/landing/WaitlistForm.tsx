"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "done" | "exists" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [exposure, setExposure] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, exposure }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus(data.status === "exists" ? "exists" : "done");
    } catch {
      setStatus("error");
      setError("Network error. Try again.");
    }
  }

  const locked = status === "done" || status === "exists";

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto mt-10 w-full max-w-lg rounded border border-[#1b2d28] bg-[#070d0d] text-left"
    >
      <div className="flex items-center justify-between gap-4 border-b border-dashed border-[#1b2d28] px-4 py-2.5 font-mono text-[10px] tracking-[0.24em]">
        <span className="text-[#66756f]">EARLY ACCESS</span>
        <span className="text-[#2ee59d]">{locked ? "ON THE LIST ✓" : "WE WRITE ONCE"}</span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] tracking-[0.18em] text-[#66756f]">
            WHICH NUMBER ARE YOU EXPOSED TO?
          </span>
          <input
            type="text"
            maxLength={120}
            placeholder="ETH perp funding, Aave borrow, gas..."
            value={exposure}
            onChange={(event) => setExposure(event.target.value)}
            disabled={locked || status === "loading"}
            className="w-full rounded-sm border border-[#1b2d28] bg-[#030506] px-4 py-3 font-mono text-sm text-[#f2f5f3] placeholder:text-[#4a5954] focus:border-[#2ee59d] focus:outline-none disabled:opacity-60"
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="your@email.com"
            aria-label="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={locked || status === "loading"}
            className="flex-1 rounded-sm border border-[#1b2d28] bg-[#030506] px-4 py-3.5 font-mono text-sm text-[#f2f5f3] placeholder:text-[#4a5954] focus:border-[#2ee59d] focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={locked || status === "loading"}
            className="rounded-sm bg-[#2ee59d] px-6 py-3.5 font-mono text-[12px] font-bold tracking-[0.14em] text-[#04231a] transition hover:bg-[#6fdcb4] disabled:hover:bg-[#2ee59d]"
          >
            {status === "loading" ? "..." : locked ? "YOU'RE IN ✓" : "NOTIFY ME"}
          </button>
        </div>
      </div>
      <p aria-live="polite" className="min-h-5 px-4 pb-3 font-mono text-[11px] tracking-wider">
        {status === "exists" && (
          <span className="text-[#2ee59d]">Already on the list. Nothing more to do.</span>
        )}
        {status === "done" && (
          <span className="text-[#2ee59d]">You&apos;re on the list. We&apos;ll write when markets open.</span>
        )}
        {status === "error" && <span className="text-[#ff9cad]">{error}</span>}
      </p>
    </form>
  );
}
