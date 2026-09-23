import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Cpu, ShieldCheck } from 'lucide-react';

export const Footer: React.FC<{ theme?: 'dark' | 'light' }> = ({ theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <footer className={`w-full border-t py-8 mt-16 text-xs transition-colors ${
      isLight ? 'border-black/10 bg-white text-[#667085]' : 'border-white/[0.07] bg-[#05060A] text-[#5F6878]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold ${
            isLight ? 'bg-[#6948FF]/10 border-[#6948FF]/30 text-[#6948FF]' : 'bg-[#8B6CFF]/15 border-[#8B6CFF]/30 text-[#8B6CFF]'
          }`}>
            ◈
          </div>
          <div>
            <span className={`font-bold tracking-tight ${isLight ? 'text-[#11131A]' : 'text-[#F7F8FC]'}`}>CALCULA X</span>
            <span className={`text-[11px] block ${isLight ? 'text-[#667085]' : 'text-[#5F6878]'}`}>Next-Generation Visual Calculator Platform</span>
          </div>
        </div>

        {/* Badges & Admin Link */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className={`flex items-center gap-1 ${isLight ? 'text-[#00875A]' : 'text-[#35E6A0]'}`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>Deterministic Math Core</span>
          </div>
          <div className={`flex items-center gap-1 ${isLight ? 'text-[#475467]' : 'text-[#9AA3B5]'}`}>
            <Shield className="w-3.5 h-3.5" />
            <span>Zero Data Leakage</span>
          </div>
          <Link
            to="/admin"
            className={`flex items-center gap-1 hover:underline ${isLight ? 'text-[#6948FF]' : 'text-[#8B6CFF]'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </Link>
        </div>

        {/* Copyright */}
        <div className={`text-[11px] ${isLight ? 'text-[#8C95A6]' : 'text-[#5F6878]'}`}>
          © {new Date().getFullYear()} CALCULA X. Precision Analytical Operating System.
        </div>

      </div>
    </footer>
  );
};
