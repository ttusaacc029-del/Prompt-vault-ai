import React from 'react';
import { Logo } from '../common/Logo';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-[#070A12]/80 backdrop-blur-sm transition-colors py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand Col */}
        <div className="md:col-span-1 space-y-3">
          <Logo size="md" showTagline={true} />
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The premier Master Prompt library and generative AI workspace for creators making Hollywood-grade AI videos.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Gemini 3.8 Flash AI Systems Online</span>
          </div>
        </div>

        {/* Platform Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3 font-display">
            Platform
          </h4>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><button onClick={() => setActiveTab('prompts')} className="hover:text-cyan-500 transition-colors">Master Prompt Library</button></li>
            <li><button onClick={() => setActiveTab('ai-tools')} className="hover:text-cyan-500 transition-colors">AI Prompt Enhancer</button></li>
            <li><button onClick={() => setActiveTab('ai-tools')} className="hover:text-cyan-500 transition-colors">Image → Video Prompt</button></li>
            <li><button onClick={() => setActiveTab('showcase')} className="hover:text-cyan-500 transition-colors">Creator Showcase</button></li>
            <li><button onClick={() => setActiveTab('pricing')} className="hover:text-cyan-500 transition-colors">Plans & Pricing</button></li>
          </ul>
        </div>

        {/* Creator Tools */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3 font-display">
            Creators & Studios
          </h4>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li><button onClick={() => setActiveTab('vault')} className="hover:text-cyan-500 transition-colors">Personal Vault Collection</button></li>
            <li><button onClick={() => setActiveTab('requests')} className="hover:text-cyan-500 transition-colors">Custom Master Prompt Requests</button></li>
            <li><button onClick={() => setActiveTab('showcase')} className="hover:text-cyan-500 transition-colors">Submit Video Showcase</button></li>
            <li><button onClick={() => setActiveTab('dashboard')} className="hover:text-cyan-500 transition-colors">Usage & Quota Tracker</button></li>
          </ul>
        </div>

        {/* Compatibility Models */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3 font-display">
            Engine Compatibility
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Master Prompts are engineered specifically for:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['Runway Gen-3', 'Kling 1.5 Pro', 'Luma Dream Machine', 'OpenAI Sora', 'Minimax Hailuo', 'Pika 2.0'].map(engine => (
              <span key={engine} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {engine}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Prompt Vault Inc. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Built with precision for next-generation AI cinematographers.
        </p>
      </div>
    </footer>
  );
};
