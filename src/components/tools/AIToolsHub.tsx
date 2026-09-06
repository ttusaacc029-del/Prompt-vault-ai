import React, { useState } from 'react';
import { PromptEnhancer } from './PromptEnhancer';
import { ImageToPrompt } from './ImageToPrompt';
import { Wand2, Image as ImageIcon, Sparkles, Sliders, Info } from 'lucide-react';

interface AIToolsHubProps {
  initialIdea?: string;
  initialTool?: 'enhancer' | 'image-to-prompt';
  onOpenPricing: () => void;
}

export const AIToolsHub: React.FC<AIToolsHubProps> = ({
  initialIdea = '',
  initialTool = 'enhancer',
  onOpenPricing
}) => {
  const [activeSubTool, setActiveSubTool] = useState<'enhancer' | 'image-to-prompt'>(initialTool);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-display">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini 3.8 Flash Generative Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
            AI Prompt Tools
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Amplify your creative concepts into production-ready prompts, or reverse-engineer reference visuals into kinetic motion commands.
          </p>
        </div>

        {/* Tool Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveSubTool('enhancer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTool === 'enhancer'
                ? 'bg-white dark:bg-[#0B1220] text-cyan-500 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Prompt Enhancer</span>
          </button>
          <button
            onClick={() => setActiveSubTool('image-to-prompt')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTool === 'image-to-prompt'
                ? 'bg-white dark:bg-[#0B1220] text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image → Video Prompt</span>
          </button>
        </div>
      </div>

      {/* Sub Tool Views */}
      {activeSubTool === 'enhancer' ? (
        <PromptEnhancer initialIdea={initialIdea} onOpenPricing={onOpenPricing} />
      ) : (
        <ImageToPrompt onOpenPricing={onOpenPricing} />
      )}

    </div>
  );
};
