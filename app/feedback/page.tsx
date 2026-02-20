"use client";

import React, { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { PageLayout } from "../components/PageLayout";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || undefined,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });
      setSent(true);
      setMessage("");
      setEmail("");
      setTimeout(() => setSent(false), 4000);
    } catch {
      // Fallback: store locally
      const existing = JSON.parse(localStorage.getItem("asceswap_feedback") || "[]");
      existing.push({
        message: message.trim(),
        email: email.trim() || undefined,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("asceswap_feedback", JSON.stringify(existing));
      setSent(true);
      setMessage("");
      setEmail("");
      setTimeout(() => setSent(false), 4000);
    } finally {
      setSending(false);
    }
  };

  return (
    <PageLayout showFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#e8e6ee] mb-2 text-center">
          Feedback
        </h1>
        <p className="text-sm text-[#9896a3] mb-10 text-center">
          Help us improve Asceswap
        </p>

        {/* Feedback Card */}
        <div
          className="
            w-full max-w-lg rounded-2xl p-px
            bg-gradient-to-br from-white/10 via-white/5 to-transparent
          "
        >
          <div
            className="
              relative rounded-2xl p-6
              bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]
              border border-[#1e1e2a]
              shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]
              overflow-hidden
            "
          >
            {/* Top glow */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#34d399]/10 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Email (optional) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280] mb-1.5 block">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="
                    w-full py-3 px-4 rounded-xl
                    bg-white/[0.03] border border-white/[0.06]
                    text-sm text-[#e8e6ee] placeholder:text-[#3a3a4a]
                    focus:outline-none focus:border-[#34d399]/30
                    transition-colors
                  "
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7280] mb-1.5 block">
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think, report bugs, suggest features..."
                  rows={5}
                  className="
                    w-full py-3 px-4 rounded-xl resize-none
                    bg-white/[0.03] border border-white/[0.06]
                    text-sm text-[#e8e6ee] placeholder:text-[#3a3a4a]
                    focus:outline-none focus:border-[#34d399]/30
                    transition-colors
                  "
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className={`
                  w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                  text-[13px] font-bold transition-all duration-200
                  ${
                    sent
                      ? "bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30"
                      : message.trim()
                        ? "bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20 hover:bg-[#34d399]/20 active:scale-[0.97] cursor-pointer"
                        : "bg-white/[0.03] text-[#3a3a4a] border border-white/[0.04] cursor-not-allowed"
                  }
                `}
              >
                {sent ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Thank you for your feedback!
                  </>
                ) : sending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Feedback
                  </>
                )}
              </button>
            </div>

            {/* Decorative glow */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 blur-3xl opacity-20 bg-[#34d399]" />
          </div>
        </div>

        {/* Join Us */}
        <div className="flex flex-col items-center gap-3 mt-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
            Join Us
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/asceswap"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#34d399]/30 hover:bg-[#34d399]/5 transition-all"
            >
              <svg className="w-5 h-5 text-[#9896a3] hover:text-[#e8e6ee] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://t.me/+xZKoI7ZbyuU4OGI1"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#34d399]/30 hover:bg-[#34d399]/5 transition-all"
            >
              <svg className="w-5 h-5 text-[#9896a3] hover:text-[#e8e6ee] transition-colors" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
