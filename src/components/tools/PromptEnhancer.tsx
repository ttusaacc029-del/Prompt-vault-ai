import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { SUBSCRIPTION_PLANS } from '../../lib/plans';
import { api } from '../../lib/api';
import { 
  Wand2, Copy, Check, FolderLock, RefreshCw, Trash2, Edit3, 
  Sparkles, ArrowRight, AlertCircle, Sliders, Play, Film, CheckCircle2
} from 'lucide-react';

interface PromptEnhancerProps {
  initialIdea?: string;
  onOpenPricing: () => void;
}

export const PromptEnhancer: React.FC<PromptEnhancerProps> = ({
  initialIdea = '',
  onOpenPricing
}) => {
  const { user, usage, refreshUsage, showToast } = useAuth();
  const [idea, setIdea] = useState(initialIdea);
  const [style, setStyle] = useState('Cinematic Photoreal 35mm');
  const [duration, setDuration] = useState('5s');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [cameraStyle, setCameraStyle] = useState('Smooth Steadicam Tracking');
  const [visualQuality, setVisualQuality] = useState('4K Photorealistic');

  const [isLoading, setIsLoading] = useState(false);
  const [enhancedOutput, setEnhancedOutput] = useState('');
  const [isEditingOutput, setIsEditingOutput] = useState(false);
  const [editedOutput, setEditedOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userPlan = user?.plan || 'FREE';
  const planConfig = SUBSCRIPTION_PLANS[userPlan];
  const monthlyLimit = planConfig.promptEnhancer;
  const usedCount = usage?.promptEnhancerUsed || 0;
  const isUnlimited = monthlyLimit === 'unlimited';
  const remainingCount = isUnlimited ? 'unlimited' : Math.max(0, (monthlyLimit as number) - usedCount);
  const isLimitReached = !isUnlimited && (remainingCount as number) <= 0;

  const sampleIdeas = [
    'A lion walking in a futuristic neon city alley during rain',
    'A vintage steam locomotive barreling across snowy Swiss viaduct',
    'A bottle of artisanal cold brew coffee splashed with almond milk',
    'A samurai meditating under cherry blossoms as pink petals swirl'
  ];

  const handleEnhance = async () => {
    if (!idea.trim()) {
      setErrorMessage('Please describe your idea first.');
      return;
    }
    if (isLimitReached) {
      setErrorMessage("You've reached your monthly limit. Please upgrade to increase or remove limits.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await api.enhancePrompt({
        userId: user?.uid || 'usr-free',
        userPlan,
        idea: idea.trim(),
        style,
        duration,
        aspectRatio,
        cameraStyle,
        visualQuality
      });

      setEnhancedOutput(res.enhancedPrompt);
      setEditedOutput(res.enhancedPrompt);
      setIsEditingOutput(false);
      await refreshUsage();
      showToast('Master Prompt generated!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to enhance prompt. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = isEditingOutput ? editedOutput : enhancedOutput;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setIdea('');
    setEnhancedOutput('');
    setEditedOutput('');
    setIsEditingOutput(false);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Usage quota bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Prompt Enhancer Credits
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              {isUnlimited
                ? `Unlimited on ${userPlan} Plan (${usedCount} generated this month)`
                : `${usedCount} / ${monthlyLimit} used (${remainingCount} remaining)`}
            </p>
          </div>
        </div>

        {!isUnlimited && (
          <div className="flex items-center gap-3">
            <div className="w-32 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isLimitReached ? 'bg-rose-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, (usedCount / (monthlyLimit as number)) * 100)}%` }}
              />
            </div>
            {isLimitReached && (
              <button
                onClick={onOpenPricing}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold text-black bg-amber-400 hover:bg-amber-300 transition-colors"
              >
                Upgrade Plan
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Enhancer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Column */}
        <div className="lg:col-span-6 space-y-5 p-6 rounded-2xl bg-white dark:bg-[#090F1C] border border-slate-200 dark:border-slate-800 shadow-sm">
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Describe your idea</span>
              <button
                onClick={handleClear}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-normal normal-case"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </label>
            <textarea
              id="prompt-enhancer-input"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A lion walking in a city..."
              rows={4}
              className="mt-2 w-full p-3.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Quick Idea Starters */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Quick Concept Starters:
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {sampleIdeas.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setIdea(s)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-left truncate max-w-full"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Parameters */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-500 dark:text-cyan-400 font-display flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Cinematic Controls</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              
              {/* Style */}
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Visual Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Cinematic Photoreal 35mm">Cinematic Photoreal 35mm</option>
                  <option value="Hyper-Realistic 8K IMAX">Hyper-Realistic 8K IMAX</option>
                  <option value="Vintage 35mm Kodachrome Film">Vintage 35mm Kodachrome Film</option>
                  <option value="Cyberpunk Neon Noir">Cyberpunk Neon Noir</option>
                  <option value="Commercial Luxury Product Macro">Commercial Luxury Macro</option>
                  <option value="Anime Studio Ghibli Aesthetic">Anime Studio Ghibli Aesthetic</option>
                  <option value="Stylized 3D Pixar Animation">Stylized 3D Pixar Animation</option>
                </select>
              </div>

              {/* Camera Movement */}
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Camera Movement
                </label>
                <select
                  value={cameraStyle}
                  onChange={(e) => setCameraStyle(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Smooth Steadicam Tracking">Smooth Steadicam Tracking</option>
                  <option value="Dynamic FPV Drone Dive">Dynamic FPV Drone Dive</option>
                  <option value="Slow 360-degree Orbital Pan">Slow 360-degree Orbital Pan</option>
                  <option value="Low-Angle Forward Dolly Push">Low-Angle Forward Dolly Push</option>
                  <option value="Gritty Handheld Documentary Shake">Gritty Handheld Shake</option>
                  <option value="Extreme Macro Probe Lens Flythrough">Extreme Macro Probe Lens</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="16:9 Widescreen (YouTube/Desktop)">16:9 Widescreen</option>
                  <option value="9:16 Vertical (TikTok/Reels/Shorts)">9:16 Vertical (Shorts)</option>
                  <option value="2.39:1 Anamorphic Cinema Scope">2.39:1 Anamorphic Scope</option>
                  <option value="1:1 Square (Instagram)">1:1 Square</option>
                </select>
              </div>

              {/* Duration & Quality */}
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Scene Cadence / Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="5s Standard Runway/Kling clip">5 seconds (Standard)</option>
                  <option value="10s Extended Sequence">10 seconds (Extended)</option>
                  <option value="15s Sora Multi-Beat Scene">15 seconds (Narrative)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            id="prompt-enhancer-submit-btn"
            onClick={handleEnhance}
            disabled={isLoading || isLimitReached}
            className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isLimitReached
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Transforming with Gemini 3.8 Flash...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Enhance Into Master Video Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-6 flex flex-col p-6 rounded-2xl bg-white dark:bg-[#090F1C] border border-slate-200 dark:border-slate-800 shadow-sm justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-display">
                  Generated Master Prompt
                </span>
              </div>
              {enhancedOutput && (
                <button
                  onClick={() => setIsEditingOutput(!isEditingOutput)}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-cyan-400 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingOutput ? 'Lock Edit' : 'Edit Prompt'}</span>
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="mt-4">
              {enhancedOutput ? (
                isEditingOutput ? (
                  <textarea
                    value={editedOutput}
                    onChange={(e) => setEditedOutput(e.target.value)}
                    rows={10}
                    className="w-full p-4 rounded-xl text-xs sm:text-sm font-mono bg-slate-900 text-cyan-200 border border-cyan-500/40 focus:outline-none leading-relaxed"
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed border border-slate-800 shadow-inner max-h-[380px] overflow-y-auto">
                    {enhancedOutput}
                  </div>
                )
              ) : (
                <div className="py-24 text-center space-y-3">
                  <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 w-fit mx-auto">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Ready to generate
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Enter an idea on the left and click enhance. Your tailored camera parameters, lighting, and cinematic optics will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          {enhancedOutput && (
            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleEnhance}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Master Prompt'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
