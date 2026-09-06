import React, { useState, useEffect } from 'react';
import { Prompt, CustomPromptRequest, SubscriptionPlan } from '../../types';
import { useAuth } from '../../lib/authContext';
import { SUBSCRIPTION_PLANS } from '../../lib/plans';
import { api } from '../../lib/api';
import { 
  FolderLock, Wand2, Image as ImageIcon, Sparkles, Copy, Check, 
  Trash2, Plus, ArrowUpRight, Crown, Shield, Clock, CheckCircle2, 
  Layers, ExternalLink, Calendar
} from 'lucide-react';

interface UserDashboardProps {
  onSelectPrompt: (prompt: Prompt) => void;
  onOpenPricing: () => void;
  initialSubTab?: 'overview' | 'vault' | 'requests';
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onSelectPrompt,
  onOpenPricing,
  initialSubTab = 'overview'
}) => {
  const { user, usage, refreshUsage, toggleFavorite, showToast } = useAuth();
  const [subTab, setSubTab] = useState<'overview' | 'vault' | 'requests'>(initialSubTab);
  const [savedPrompts, setSavedPrompts] = useState<Prompt[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomPromptRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Request Form modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqEngine, setReqEngine] = useState('Runway Gen-3 Alpha');
  const [reqAspect, setReqAspect] = useState('16:9');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  const plan = user?.plan || 'FREE';
  const planInfo = SUBSCRIPTION_PLANS[plan];

  const fetchDashboardData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [favs, reqs] = await Promise.all([
        api.getFavorites(user.uid, user.plan),
        api.getCustomRequests(user.uid)
      ]);
      setSavedPrompts(favs);
      setCustomRequests(reqs);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.uid, user?.plan]);

  const handleCopy = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.fullPrompt);
    setCopiedId(prompt.id);
    showToast('Prompt copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    await toggleFavorite(promptId);
    setSavedPrompts(prev => prev.filter(p => p.id !== promptId));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqDesc.trim()) {
      showToast('Please provide a title and detailed requirements.');
      return;
    }

    setIsSubmittingReq(true);
    try {
      await api.submitCustomRequest({
        userId: user?.uid,
        userName: user?.name,
        userEmail: user?.email,
        userPlan: user?.plan,
        title: reqTitle.trim(),
        description: reqDesc.trim(),
        targetEngine: reqEngine,
        aspectRatio: reqAspect
      });

      showToast('Custom request submitted to Prompt Vault directors!');
      setIsRequestModalOpen(false);
      setReqTitle('');
      setReqDesc('');
      await refreshUsage();
      await fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit request');
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // Usage calculations (safe guards against NaN, undefined, or null)
  const rawEnhancerLimit = planInfo?.promptEnhancer ?? 0;
  const isEnhancerUnlimited = rawEnhancerLimit === 'unlimited';
  const enhancerLimitNum = isEnhancerUnlimited ? Infinity : (Number(rawEnhancerLimit) || 0);
  const enhancerUsed = Number(usage?.promptEnhancerUsed) || 0;
  const enhancerRemaining = isEnhancerUnlimited ? 'Unlimited' : Math.max(0, enhancerLimitNum - enhancerUsed);

  const rawImageLimit = planInfo?.imageToPrompt ?? 0;
  const isImageUnlimited = rawImageLimit === 'unlimited';
  const imageLimitNum = isImageUnlimited ? Infinity : (Number(rawImageLimit) || 0);
  const imageUsed = Number(usage?.imageToPromptUsed) || 0;
  const imageRemaining = isImageUnlimited ? 'Unlimited' : Math.max(0, imageLimitNum - imageUsed);

  const rawRequestLimit = planInfo?.customRequests ?? (planInfo as any)?.customPromptRequests ?? 0;
  const isRequestUnlimited = rawRequestLimit === 'unlimited';
  const requestLimitNum = isRequestUnlimited ? Infinity : (Number(rawRequestLimit) || 0);
  const requestUsed = Number(usage?.customRequestsUsed) || 0;
  const requestRemaining = isRequestUnlimited ? 'Unlimited' : Math.max(0, requestLimitNum - requestUsed);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Profile Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <img
            src={user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
            alt={user?.name || 'User'}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-500/30"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-display">
                {user?.name || 'Creator'}
              </h1>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                plan === 'STUDIO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                plan === 'PRO' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                plan === 'PLUS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                'bg-slate-500/10 text-slate-400 border-slate-500/30'
              }`}>
                {plan} TIER
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email} • Member since {user?.createdAt || '2026'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPricing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Manage Subscription</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            subTab === 'overview'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-white'
          }`}
        >
          Usage & Quotas
        </button>
        <button
          onClick={() => setSubTab('vault')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'vault'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-white'
          }`}
        >
          <FolderLock className="w-3.5 h-3.5" />
          <span>My Vault ({savedPrompts.length})</span>
        </button>
        <button
          onClick={() => setSubTab('requests')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            subTab === 'requests'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-500 dark:text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Custom Requests ({customRequests.length})</span>
        </button>
      </div>

      {/* 1. OVERVIEW & USAGE */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Metric 1: Prompt Enhancer */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Wand2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">Monthly Quota</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  AI Prompt Enhancer
                </h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                    {enhancerRemaining}
                  </span>
                  <span className="text-xs text-slate-500">remaining</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Used: {enhancerUsed} / {isEnhancerUnlimited ? 'Unlimited' : (enhancerLimitNum || 0)}
                </p>
              </div>
              {!isEnhancerUnlimited && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, enhancerLimitNum > 0 ? (enhancerUsed / enhancerLimitNum) * 100 : 0)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Metric 2: Image to Prompt */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">Monthly Quota</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Image → Video Prompt
                </h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                    {imageRemaining}
                  </span>
                  <span className="text-xs text-slate-500">remaining</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Used: {imageUsed} / {isImageUnlimited ? 'Unlimited' : (imageLimitNum || 0)}
                </p>
              </div>
              {!isImageUnlimited && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, imageLimitNum > 0 ? (imageUsed / imageLimitNum) * 100 : 0)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Metric 3: Custom Requests */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400">Custom Engineering</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Custom Prompt Requests
                </h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                    {requestRemaining}
                  </span>
                  <span className="text-xs text-slate-500">available</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Used: {requestUsed} / {isRequestUnlimited ? 'Unlimited' : (requestLimitNum || 0)} this billing period
                </p>
              </div>
              {requestLimitNum === 0 && !isRequestUnlimited ? (
                <button
                  onClick={onOpenPricing}
                  className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"
                >
                  <span>Requires Pro or Studio tier</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              ) : (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${isRequestUnlimited ? 100 : Math.min(100, requestLimitNum > 0 ? (requestUsed / requestLimitNum) * 100 : 0)}%` }}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Quick Shortcuts to My Vault */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Recently Saved in My Vault
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Quick access to your stashed Master Prompts.
                </p>
              </div>
              <button
                onClick={() => setSubTab('vault')}
                className="text-xs font-bold text-cyan-500 hover:underline"
              >
                View all ({savedPrompts.length})
              </button>
            </div>

            {savedPrompts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Your vault is empty. Browse the Prompt Library and click the lock icon to save your favorites!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPrompts.slice(0, 3).map(p => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPrompt(p)}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-cyan-500/50 transition-colors flex items-center gap-3"
                  >
                    <img src={p.thumbnail} alt={p.title} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="overflow-hidden flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-display">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{p.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MY VAULT TAB */}
      {subTab === 'vault' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                My Vault Collection
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your personal repository of saved Master Prompts. Unlimited saves across all subscription tiers.
              </p>
            </div>
          </div>

          {savedPrompts.length === 0 ? (
            <div className="py-20 text-center space-y-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <FolderLock className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Your Vault is currently empty
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Whenever you see a prompt you want to keep, click the vault icon to organize it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  onClick={() => onSelectPrompt(prompt)}
                  className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A101E] overflow-hidden hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-slate-900">
                    <img src={prompt.thumbnail} alt={prompt.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-cyan-300 backdrop-blur-md">
                        {prompt.accessLevel}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                        {prompt.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {prompt.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => handleRemoveFavorite(e, prompt.id)}
                        className="text-rose-400 hover:text-rose-500 flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>

                      <button
                        onClick={(e) => handleCopy(e, prompt)}
                        className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
                      >
                        {copiedId === prompt.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. CUSTOM REQUESTS TAB */}
      {subTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                Custom Master Prompt Requests
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Request specialized, bespoke prompts from our senior prompt directors. (Pro: 1/mo, Studio: 5/mo)
              </p>
            </div>

            <button
              onClick={() => {
                const hasNoQuota = !isRequestUnlimited && (requestLimitNum <= 0 || (typeof requestRemaining === 'number' && requestRemaining <= 0));
                if (hasNoQuota) {
                  onOpenPricing();
                } else {
                  setIsRequestModalOpen(true);
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{requestLimitNum === 0 ? 'Upgrade to Request Custom Prompts' : 'New Custom Request'}</span>
            </button>
          </div>

          {customRequests.length === 0 ? (
            <div className="py-20 text-center space-y-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No custom requests yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need a specific look or difficult scene for a commercial or film? Submit a request and our engineers will create it for you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customRequests.map(req => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                      {req.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      req.status === 'FULFILLED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      req.status === 'IN_PROGRESS' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {req.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>Engine: {req.targetEngine}</span>
                    <span>•</span>
                    <span>Ratio: {req.aspectRatio}</span>
                    <span>•</span>
                    <span>Requested: {req.createdAt}</span>
                  </div>

                  {req.fulfilledPrompt && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-cyan-200 font-mono text-xs border border-cyan-500/30">
                      <div className="flex items-center justify-between mb-1 text-[10px] text-cyan-400 font-bold uppercase">
                        <span>Fulfilled Master Prompt</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(req.fulfilledPrompt!);
                            showToast('Prompt copied!');
                          }}
                          className="hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      {req.fulfilledPrompt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Custom Request Modal */}
      {isRequestModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setIsRequestModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Submit Custom Prompt Request
              </h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Project / Scene Title
                </label>
                <input
                  type="text"
                  required
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="e.g. High-speed cinematic night drive for electric car brand"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target AI Engine
                  </label>
                  <select
                    value={reqEngine}
                    onChange={(e) => setReqEngine(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Runway Gen-3 Alpha">Runway Gen-3 Alpha</option>
                    <option value="Kling 1.5 Pro">Kling 1.5 Pro</option>
                    <option value="Luma Dream Machine">Luma Dream Machine</option>
                    <option value="OpenAI Sora">OpenAI Sora</option>
                    <option value="Minimax Hailuo">Minimax Hailuo</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={reqAspect}
                    onChange={(e) => setReqAspect(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="16:9 Widescreen">16:9 Widescreen</option>
                    <option value="9:16 Vertical">9:16 Vertical</option>
                    <option value="2.39:1 CinemaScope">2.39:1 CinemaScope</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Detailed Scene Requirements & Visual Reference
                </label>
                <textarea
                  required
                  rows={4}
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Describe your subject, required camera movements, lighting atmosphere, mood, color grade, and any specific constraints..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReq}
                  className="w-full py-2.5 rounded-xl font-bold text-black bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 shadow-md shadow-amber-500/20 transition-all"
                >
                  {isSubmittingReq ? 'Submitting...' : 'Submit to Senior Prompt Directors'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
