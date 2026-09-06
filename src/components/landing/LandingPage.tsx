import React, { useState } from 'react';
import { Prompt, CreatorVideo } from '../../types';
import { useAuth } from '../../lib/authContext';
import { 
  Sparkles, ArrowRight, Copy, Check, Lock, Play, Compass, 
  FolderLock, Share2, Wand2, Image as ImageIcon, Zap, CheckCircle2, 
  ChevronRight, Star, Shield, Film
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../../lib/plans';

interface LandingPageProps {
  prompts: Prompt[];
  videos: CreatorVideo[];
  setActiveTab: (tab: string) => void;
  onSelectPrompt: (prompt: Prompt) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  prompts,
  videos,
  setActiveTab,
  onSelectPrompt,
  onOpenAuth
}) => {
  const { user, toggleFavorite, isPromptSaved, showToast } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [heroPromptIdea, setHeroPromptIdea] = useState('A neon cybernetic panther prowling through misty bamboo forest at night');

  const featuredPrompts = prompts.filter(p => p.featuredStatus).slice(0, 4);
  const showcasePreview = videos.slice(0, 3);

  const handleCopy = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    if (prompt.isLockedForUser) {
      showToast(`This prompt is locked. Upgrade to ${prompt.requiredPlan} to copy.`);
      return;
    }
    navigator.clipboard.writeText(prompt.fullPrompt);
    setCopiedId(prompt.id);
    showToast('Prompt copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-24 pb-20 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Subtle glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-indigo-600/20 blur-[100px] pointer-events-none rounded-full" />

        <div className="text-center max-w-3xl mx-auto space-y-6 relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>The Premier AI Video Prompt Engine</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display leading-[1.15]">
            Your Vault of Powerful <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              AI Video Prompts
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover, enhance, create and share professional AI video prompts — all in one place. Engineered for Runway, Kling, Luma, Sora, and Minimax.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <button
              id="hero-explore-btn"
              onClick={() => setActiveTab('prompts')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 group transition-all"
            >
              <span>Explore Prompts</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="hero-try-enhancer-btn"
              onClick={() => setActiveTab('ai-tools')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Wand2 className="w-4 h-4 text-cyan-400" />
              <span>Try AI Prompt Enhancer</span>
            </button>
          </div>
        </div>

        {/* Hero Interactive Visual: Master Prompt Vault Preview Card */}
        <div className="mt-14 relative z-10 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/90 bg-white/70 dark:bg-[#0B1220]/80 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
            
            {/* Header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-2 font-mono">
                  PROMPT-STUDIO // ANAMORPHIC_CINEMA
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Runway Gen-3 & Kling 1.5 Ready
                </span>
              </div>
            </div>

            {/* Prompt Content Preview */}
            <div className="pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                  Cyberpunk Neon Rain Alley Tracking Shot
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  FREE ACCESS
                </span>
              </div>

              {/* Master Prompt with highlighted variables */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs sm:text-sm leading-relaxed border border-slate-800">
                <p>
                  Cinematic 35mm anamorphic footage of <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">[SUBJECT: cybernetic investigator with illuminated ocular implants]</span> walking purposefully through <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">[LOCATION: Neo-Shinjuku alley drenched in rain]</span>. Puddles reflect flickering neon signs. <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">[CAMERA MOVEMENT: Low-angle backward Steadicam glide]</span>, maintaining razor-sharp focus on the drenched trench coat with soft oval bokeh in background. 2.39:1 aspect ratio, 24fps motion cadence, Kodachrome color grade.
                </p>
              </div>

              {/* Interactive bottom bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">5 Variables</span>
                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">4K Photoreal</span>
                  <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">Unlimited Copies</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('Cinematic 35mm anamorphic footage of a cybernetic investigator in Neo-Shinjuku alley with rain reflections...');
                      showToast('Master prompt copied!');
                    }}
                    className="px-4 py-2 rounded-lg font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Master Prompt</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('prompts')}
                    className="px-4 py-2 rounded-lg font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 flex items-center gap-1.5 transition-opacity"
                  >
                    <span>View in Library</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY PROMPT VAULT? */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-display">
            The Creator Advantage
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
            Why Prompt Vault?
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            AI video generators are only as good as the prompt you feed them. Prompt Vault eliminates the guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {[
            {
              title: 'Stop Struggling With Prompts',
              desc: 'No more blurry artifacts, erratic camera jitter, or melted limbs from vague one-liners.',
              icon: Zap,
              color: 'text-rose-400'
            },
            {
              title: 'Discover Master Prompts',
              desc: 'Curated by cinematographers with exact lens specs, lighting setups, and camera moves.',
              icon: Compass,
              color: 'text-cyan-400'
            },
            {
              title: 'Create Better Videos Faster',
              desc: 'Cut iteration cycles from hours to seconds with proven cinematic templates.',
              icon: Film,
              color: 'text-blue-400'
            },
            {
              title: 'Organize Your Vault',
              desc: 'Save unlimited prompts, tag custom workflows, and build your private creative stash.',
              icon: FolderLock,
              color: 'text-purple-400'
            },
            {
              title: 'Enhance Ideas With AI',
              desc: 'Powered by server-side Gemini 3.8 Flash to transform raw concepts into Master Prompts.',
              icon: Wand2,
              color: 'text-amber-400'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-[#0A101D] border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-colors shadow-sm"
              >
                <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 w-fit ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full bg-slate-50/50 dark:bg-slate-900/30 py-16 rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-display">
            Streamlined Workflow
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
            How It Works
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            From raw spark to published video in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            {
              step: 'Step 1',
              title: 'Discover a prompt',
              desc: 'Browse hundreds of Master Prompts across 20+ specialized cinematic categories.'
            },
            {
              step: 'Step 2',
              title: 'Customize or enhance it',
              desc: 'Fill in dynamic variables or run the AI Prompt Enhancer to tailor the scene parameters.'
            },
            {
              step: 'Step 3',
              title: 'Generate your AI video',
              desc: 'Copy in one click and paste into Runway Gen-3, Kling, Luma Dream Machine, or Sora.'
            },
            {
              step: 'Step 4',
              title: 'Share your creation',
              desc: 'Publish your finished AI video to the Creator Showcase and build your creator reputation.'
            }
          ].map((s, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-[#070D18] border border-slate-200 dark:border-slate-800 relative group"
            >
              <div className="text-xs font-mono font-bold text-cyan-500 dark:text-cyan-400 mb-2">
                {s.step}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mb-2">
                {s.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PROMPTS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-display">
              Handpicked Masterpieces
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
              Featured Master Prompts
            </p>
          </div>
          <button
            onClick={() => setActiveTab('prompts')}
            className="flex items-center gap-1 text-xs font-bold text-cyan-500 hover:text-cyan-400"
          >
            <span>Explore full library ({prompts.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPrompts.map(prompt => (
            <div
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt)}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#090F1C] overflow-hidden hover:border-cyan-500/50 hover:shadow-xl transition-all flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                <img
                  src={prompt.thumbnail}
                  alt={prompt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 right-2.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${
                    prompt.accessLevel === 'FREE' ? 'bg-emerald-500/80 text-white' :
                    prompt.accessLevel === 'PLUS' ? 'bg-blue-500/80 text-white' :
                    prompt.accessLevel === 'PRO' ? 'bg-cyan-500/80 text-white' :
                    'bg-amber-500/80 text-white'
                  }`}>
                    {prompt.accessLevel}
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/60 text-slate-200 backdrop-blur-md">
                    {prompt.category}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-400 transition-colors font-display">
                    {prompt.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {prompt.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <span className="text-[11px] text-slate-400">
                    {prompt.copiesCount.toLocaleString()} copies
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(prompt.id); }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isPromptSaved(prompt.id)
                          ? 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
                          : 'text-slate-400 border-slate-200 dark:border-slate-700 hover:text-white'
                      }`}
                      title="Save to vault"
                    >
                      <FolderLock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleCopy(e, prompt)}
                      className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                      title="Copy prompt"
                    >
                      {copiedId === prompt.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. AI TOOLS HUB PREVIEW */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-display">
            Built-In Intelligence
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
            AI Prompt Engineering Tools
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Powered by server-side Gemini 3.8 Flash to elevate your prompt workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tool 1: Prompt Enhancer */}
          <div className="p-7 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0B1426] border border-cyan-500/30 text-white relative overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Wand2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display">AI Prompt Enhancer</h3>
                <p className="text-xs text-slate-300">Turn simple one-liners into cinematic Master Prompts</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Enter a basic idea like <em>"A lion walking in a city"</em> and our AI injects subject details, camera movement, lens optics, lighting, mood, and motion cadence while strictly preserving your core concept.
            </p>
            <div className="space-y-2 mb-6">
              <div className="p-2.5 rounded-lg bg-black/40 text-[11px] font-mono text-slate-300 border border-slate-800">
                Input: "A futuristic sports car drifting on neon wet asphalt"
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-950/40 text-[11px] font-mono text-cyan-200 border border-cyan-800/40">
                Output: "Cinematic 35mm anamorphic footage of carbon-fiber hypercar executing low-radius drift..."
              </div>
            </div>
            <button
              onClick={() => setActiveTab('ai-tools')}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch Prompt Enhancer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tool 2: Image to Prompt */}
          <div className="p-7 rounded-2xl bg-gradient-to-br from-slate-900 to-[#120D24] border border-purple-500/30 text-white relative overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display">Image → Video Prompt</h3>
                <p className="text-xs text-slate-300">Reverse-engineer reference stills into animated video prompts</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Upload any JPG, PNG, or WEBP image. Multimodal Gemini 3.8 Flash dissects subject, lighting, environment, and recommends natural kinetic motion and camera paths for video models.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-6 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-slate-300">
                Multimodal Optical Analysis
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-slate-300">
                Kinetic Motion Suggestions
              </div>
            </div>
            <button
              onClick={() => setActiveTab('ai-tools')}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch Image → Prompt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. CREATOR SHOWCASE PREVIEW */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-display">
              Community Gallery
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
              Creator Showcase
            </p>
          </div>
          <button
            onClick={() => setActiveTab('showcase')}
            className="flex items-center gap-1 text-xs font-bold text-cyan-500 hover:text-cyan-400"
          >
            <span>View all creator creations</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {showcasePreview.map(vid => (
            <div
              key={vid.id}
              onClick={() => setActiveTab('showcase')}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0A101E] overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-3 rounded-full bg-cyan-500/90 text-white shadow-lg">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white">
                  {vid.category}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-400 font-display">
                  {vid.title}
                </h4>
                <div className="flex items-center gap-2 pt-1">
                  <img
                    src={vid.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={vid.creatorName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {vid.creatorName}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PRICING TEASER */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-display">
            Transparent Subscriptions
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display">
            Plans for Every Level of AI Creator
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Unlimited prompt copies and vault saves across all tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(['FREE', 'PLUS', 'PRO', 'STUDIO'] as const).map(planKey => {
            const plan = SUBSCRIPTION_PLANS[planKey];
            const isStudio = planKey === 'STUDIO';
            const isPro = planKey === 'PRO';
            return (
              <div
                key={planKey}
                className={`p-6 rounded-2xl flex flex-col justify-between border transition-all ${
                  isPro
                    ? 'border-cyan-500/80 bg-cyan-950/20 shadow-xl shadow-cyan-500/10'
                    : isStudio
                    ? 'border-amber-500/80 bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B101D]'
                }`}
              >
                <div className="space-y-4">
                  {plan.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {plan.badge}
                    </span>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                      {plan.displayName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {plan.description}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>

                  <ul className="space-y-2.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
                    {plan.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isPro
                        ? 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-md shadow-cyan-500/25'
                        : isStudio
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    View Plan Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-700 to-indigo-800 p-8 sm:p-14 text-center text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display">
              Start Creating Better AI Videos
            </h2>
            <p className="text-sm sm:text-base text-cyan-100 leading-relaxed">
              Join thousands of AI directors, creators, and studios generating cinema-grade footage with Prompt Vault.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('prompts')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-white text-slate-900 hover:bg-slate-100 shadow-xl transition-colors"
              >
                Explore Master Prompts Now
              </button>
              <button
                onClick={() => setActiveTab('pricing')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-black/25 text-white hover:bg-black/40 border border-white/20 transition-colors"
              >
                Compare Plans
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
