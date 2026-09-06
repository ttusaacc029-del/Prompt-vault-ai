import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { useTheme } from '../../lib/themeContext';
import { SUBSCRIPTION_PLANS } from '../../lib/plans';
import { 
  X, User as UserIcon, Settings, Shield, Bell, Moon, Sun, 
  CreditCard, Check, LogOut, Sparkles, Key, CheckCircle2, Crown
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenPricing
}) => {
  const { user, logout, showToast } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');

  // Form states
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [defaultEngine, setDefaultEngine] = useState('Runway Gen-3 Alpha');
  const [aspectRatioPref, setAspectRatioPref] = useState('16:9 Widescreen');

  // Notification toggles
  const [notifyReqUpdates, setNotifyReqUpdates] = useState(true);
  const [notifyAiCompletion, setNotifyAiCompletion] = useState(true);
  const [notifyWeeklyDrops, setNotifyWeeklyDrops] = useState(false);

  if (!isOpen || !user) return null;

  const planInfo = SUBSCRIPTION_PLANS[user.plan];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile preferences updated!');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Account Profile & Settings
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body with Side Nav */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Sub Navigation */}
          <div className="w-full md:w-48 p-3 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 space-y-1 text-xs font-semibold">
            {[
              { id: 'profile', label: 'Profile', icon: UserIcon },
              { id: 'preferences', label: 'AI Preferences', icon: Sparkles },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'security', label: 'Security & Auth', icon: Shield },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 mt-4">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Tab Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
            
            {/* 1. PROFILE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex items-center gap-4">
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-500/40"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                      {user.name}
                    </h3>
                    <p className="text-slate-400 text-[11px]">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {user.plan} MEMBER
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Email Address (Verified via Firebase)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Current Subscription: {planInfo.displayName}</span>
                      <span className="text-[11px] text-slate-400">Account status: {user.subscriptionStatus}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPricing();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 flex items-center gap-1"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Change Plan</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl font-bold text-white bg-cyan-500 hover:bg-cyan-400"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* 2. AI PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display mb-1">
                    AI Video Generator Defaults
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    Tailors AI Prompt Enhancer and Image-to-Prompt models to output parameters optimized for your favorite tool.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Primary AI Video Platform
                    </label>
                    <select
                      value={defaultEngine}
                      onChange={(e) => setDefaultEngine(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Runway Gen-3 Alpha">Runway Gen-3 Alpha</option>
                      <option value="Kling 1.5 Pro">Kling 1.5 Pro</option>
                      <option value="Luma Dream Machine">Luma Dream Machine</option>
                      <option value="OpenAI Sora">OpenAI Sora</option>
                      <option value="Minimax Hailuo">Minimax Hailuo</option>
                      <option value="Pika 2.0">Pika 2.0</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Default Aspect Ratio
                    </label>
                    <select
                      value={aspectRatioPref}
                      onChange={(e) => setAspectRatioPref(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="16:9 Widescreen">16:9 Widescreen (YouTube, Cinema)</option>
                      <option value="9:16 Vertical">9:16 Vertical (TikTok, Reels, Shorts)</option>
                      <option value="2.39:1 CinemaScope">2.39:1 Anamorphic Scope</option>
                      <option value="1:1 Square">1:1 Square</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Theme Appearance</span>
                      <span className="text-[11px] text-slate-400">Current: {theme === 'dark' ? 'Obsidian Dark' : 'Clean Light'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-500" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display mb-1">
                    Notification Preferences
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    Choose which notifications you wish to receive in Prompt Vault.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Custom Request Updates</span>
                      <span className="text-[11px] text-slate-400">Alert me when prompt directors review or fulfill my request</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyReqUpdates}
                      onChange={(e) => setNotifyReqUpdates(e.target.checked)}
                      className="rounded text-cyan-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">AI Generation Complete</span>
                      <span className="text-[11px] text-slate-400">Notify when high-complexity image analysis completes</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyAiCompletion}
                      onChange={(e) => setNotifyAiCompletion(e.target.checked)}
                      className="rounded text-cyan-500 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Weekly Master Prompt Drops</span>
                      <span className="text-[11px] text-slate-400">Digest of newly added Runway Gen-3 and Sora prompt recipes</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyWeeklyDrops}
                      onChange={(e) => setNotifyWeeklyDrops(e.target.checked)}
                      className="rounded text-cyan-500 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* 4. SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display mb-1">
                    Security & Authentication
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    Firebase Authentication & session protection.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Account Protected by Firebase Auth</span>
                    <span className="text-[11px] text-emerald-400/80">
                      OAuth token verification is enforced on all server-side API endpoints.
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-slate-400">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span>User ID (UID)</span>
                    <span className="font-mono text-slate-300">{user.uid}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span>Account Created</span>
                    <span className="text-slate-300">{user.createdAt}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span>Session Status</span>
                    <span className="text-emerald-400 font-bold">Active SSL/TLS Session</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
