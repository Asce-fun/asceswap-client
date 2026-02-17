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
        className="absolute inset-0 bg-black/75 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Container */}
      <div
        className="relative w-full bg-[#0F1115]
                   border border-[#1FD6A3]/20
                   rounded-2xl
                   overflow-hidden
                   animate-in zoom-in-95 fade-in duration-300 ease-out
                   flex flex-col
                   shadow-[0_0_80px_-20px_rgba(31,214,163,0.45),
                           0_0_120px_-40px_rgba(31,214,163,0.25),
                           0_30px_60px_-20px_rgba(0,0,0,0.9)]"
        style={{
          maxWidth,
          maxHeight: "calc(100vh - 48px)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full
                     text-white/40
                     hover:text-[#1FD6A3]
                     hover:bg-[#1FD6A3]/15
                     transition-all
                     cursor-pointer
                     z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {children}
      </div>
    </div>
  );
};
