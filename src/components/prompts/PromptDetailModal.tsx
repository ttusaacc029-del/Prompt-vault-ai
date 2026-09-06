import React, { useState } from 'react';
import { Prompt, PromptVariable } from '../../types';
import { useAuth } from '../../lib/authContext';
import { 
  X, Copy, Check, FolderLock, Sparkles, Wand2, Lock, ArrowUpRight, 
  Layers, Tag, Info, Sliders, CheckCircle2, ChevronRight
} from 'lucide-react';
import { api } from '../../lib/api';

interface PromptDetailModalProps {
  prompt: Prompt | null;
  onClose: () => void;
  onOpenPricing: () => void;
  onSendToEnhancer: (text: string) => void;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  prompt,
  onClose,
  onOpenPricing,
  onSendToEnhancer
}) => {
  const { user, toggleFavorite, isPromptSaved, showToast } = useAuth();
  const [copied, setCopied] = useState(false);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [isCustomizing, setIsCustomizing] = useState(false);

  if (!prompt) return null;

  const isLocked = prompt.isLockedForUser;

  // Compute live prompt text with customized variable replacements
  const getCompiledPrompt = () => {
    if (isLocked) return prompt.fullPrompt;
    let text = prompt.fullPrompt;
    if (prompt.customizableVariables) {
      prompt.customizableVariables.forEach(v => {
        const replacement = customValues[v.key] || v.defaultValue;
        // Replace occurrences of [KEY] or [KEY: ...]
        const regex = new RegExp(`\\[${v.key}(?::[^\\]]+)?\\]`, 'gi');
        text = text.replace(regex, replacement);
      });
    }
    return text;
  };

  const handleCopy = async () => {
    if (isLocked) {
      showToast(`This prompt requires ${prompt.requiredPlan} tier.`);
      return;
    }
    const textToCopy = getCompiledPrompt();
    await navigator.clipboard.writeText(textToCopy);
    await api.recordCopy(prompt.id);
    setCopied(true);
    showToast('Prompt copied!');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleVariableChange = (key: string, val: string) => {
    setCustomValues(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Media Banner */}
        <div className="relative aspect-[21/9] w-full bg-slate-900 overflow-hidden">
          <img
            src={prompt.thumbnail}
            alt={prompt.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-black/60" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on banner */}
          <div className="absolute bottom-4 left-6 flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-500/80 text-white backdrop-blur-md">
              {prompt.accessLevel} Tier
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/60 text-slate-200 backdrop-blur-md">
              {prompt.category}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Title & Description */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
              {prompt.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {prompt.description}
            </p>
          </div>

          {/* LOCKED EXPERIENCE vs UNLOCKED PROMPT */}
          {isLocked ? (
            <div className="p-7 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-cyan-500/10 border border-amber-500/30 text-center space-y-4">
              <div className="p-3 rounded-full bg-amber-500/20 text-amber-400 w-fit mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-display">
                  Unlock this Master Prompt with {prompt.requiredPlan}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  This prompt contains specialized camera movements, optical parameters, and variables reserved for {prompt.requiredPlan} subscribers.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => { onClose(); onOpenPricing(); }}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 transition-all"
                >
                  <span>Upgrade to {prompt.requiredPlan}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Full Master Prompt Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-500 dark:text-cyan-400 font-display">
                    Full Master Prompt
                  </span>
                  <button
                    onClick={() => setIsCustomizing(!isCustomizing)}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-cyan-400 flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isCustomizing ? 'Hide Variable Editor' : 'Customize Variables'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed border border-slate-800 shadow-inner">
                  {getCompiledPrompt()}
                </div>
              </div>

              {/* Dynamic Variables Customizer */}
              {isCustomizing && prompt.customizableVariables && prompt.customizableVariables.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Swap Prompt Variables
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prompt.customizableVariables.map(v => (
                      <div key={v.key} className="space-y-1">
                        <label className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                          [{v.key}]
                        </label>
                        <input
                          type="text"
                          value={customValues[v.key] !== undefined ? customValues[v.key] : v.defaultValue}
                          onChange={(e) => handleVariableChange(v.key, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Output & Recommended Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Expected Generation Output</span>
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {prompt.exampleOutput}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>Recommended AI Generators</span>
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {prompt.recommendedUse}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {prompt.tags.map(t => (
              <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                #{t}
              </span>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => toggleFavorite(prompt.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-colors ${
                isPromptSaved(prompt.id)
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              <FolderLock className="w-4 h-4" />
              <span>{isPromptSaved(prompt.id) ? 'Saved in Vault' : 'Save to My Vault'}</span>
            </button>

            <div className="flex items-center gap-2">
              {!isLocked && (
                <button
                  onClick={() => {
                    onClose();
                    onSendToEnhancer(getCompiledPrompt());
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
                >
                  <Wand2 className="w-4 h-4 text-cyan-400" />
                  <span>AI Enhance</span>
                </button>
              )}

              <button
                onClick={handleCopy}
                disabled={isLocked}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isLocked
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-500/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Prompt Copied!' : 'Copy Master Prompt'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
