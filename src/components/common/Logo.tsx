import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Futuristic Vault + AI Spark Icon */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/20`}>
        <div className="w-full h-full bg-[#080D18] rounded-[10px] flex items-center justify-center overflow-hidden relative">
          {/* Subtle grid backdrop */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />
          
          {/* Vault Outer Rim Hexagon / Octagon geometry */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3/5 h-3/5 text-cyan-400 relative z-10"
          >
            {/* Vault Outer Bezel */}
            <rect x="3" y="3" width="18" height="18" rx="4" className="stroke-cyan-500/80" />
            
            {/* Vault Center Dial */}
            <circle cx="12" cy="12" r="3.5" className="stroke-cyan-300 fill-cyan-950/40" />
            
            {/* AI Spark Cross radiating from core */}
            <line x1="12" y1="5.5" x2="12" y2="7.5" className="stroke-cyan-200" />
            <line x1="12" y1="16.5" x2="12" y2="18.5" className="stroke-cyan-200" />
            <line x1="5.5" y1="12" x2="7.5" y2="12" className="stroke-cyan-200" />
            <line x1="16.5" y1="12" x2="18.5" y2="12" className="stroke-cyan-200" />
            
            {/* Center Core Spark */}
            <circle cx="12" cy="12" r="1" fill="#38bdf8" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        <div className={`font-display font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1 ${textSizes[size]}`}>
          <span>Prompt</span>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Vault</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ml-1">AI</span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-400">
            Discover. Enhance. Create. Share.
          </span>
        )}
      </div>
    </div>
  );
};
