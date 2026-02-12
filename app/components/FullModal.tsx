"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface FullModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}

export const FullModal: React.FC<FullModalProps> = ({
  isOpen,
  onClose,
  maxWidth = "1080px",
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Container */}
      <div
        className="relative w-full bg-[#111114] border border-white/[0.06] rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(167,139,250,0.22)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 ease-out flex flex-col"
        style={{
          maxWidth,
          maxHeight: "calc(100vh - 48px)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-4 right-4 p-2 text-[#8A8894] hover:text-white hover:bg-white/5 rounded-full transition-all z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {children}
      </div>
    </div>
  );
};
