
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div className="relative w-full max-w-lg bg-[#0d111a] border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(59,130,246,0.1)] overflow-hidden animate-in zoom-in-95 fade-in duration-300 ease-out flex flex-col">
        {/* Close Button - Positioned absolutely inside the container */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-8 p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all z-10"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="overflow-y-auto max-h-[90vh]">
          {children}
        </div>
      </div>
    </div>
  );
};
