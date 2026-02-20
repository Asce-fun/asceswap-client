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
        <p className="text-sm text-[#9896a3] mb-1 text-center">
          Help us improve Asceswap
        </p>
        <p className="text-[10px] text-[#34d399] font-bold uppercase tracking-[0.12em] mb-10">
          Important
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
      </div>
    </PageLayout>
  );
}
