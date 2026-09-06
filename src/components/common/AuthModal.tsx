import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { Logo } from './Logo';
import { X, Mail, Lock, Sparkles, ArrowRight, Shield, Crown, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { login, signInWithGoogle, quickSwitchUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      console.error('Google sign in error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await login(email.trim());
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (preset: 'STUDIO' | 'PRO' | 'FREE' | 'ADMIN') => {
    setIsSubmitting(true);
    try {
      await quickSwitchUser(preset);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <Logo size="md" className="justify-center" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display pt-2">
            {mode === 'login' ? 'Welcome Back to Prompt Vault' : 'Create Your Creator Account'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? 'Sign in to access your vault, AI credits, and custom requests.' : 'Unlock the premier library of cinematographic AI prompts.'}
          </p>
        </div>

        {/* Google Firebase Authentication */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center gap-2.5 text-xs shadow-sm hover:shadow"
          >
            <LogIn className="w-4 h-4 text-cyan-500" />
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 font-medium">or continue with email</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Elena Rostova"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@promptvault.ai"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{mode === 'login' ? 'Sign In' : 'Get Started Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Profiles for Seamless Testing */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
            Or Test 1-Click Demo Profiles
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoLogin('STUDIO')}
              className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-left transition-colors"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Studio Plan</span>
                <Crown className="w-3 h-3" />
              </div>
              <p className="text-[10px] text-amber-200/70">Unlimited AI & 5 Reqs</p>
            </button>

            <button
              onClick={() => handleDemoLogin('PRO')}
              className="p-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-left transition-colors"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Pro Plan</span>
                <Sparkles className="w-3 h-3" />
              </div>
              <p className="text-[10px] text-cyan-200/70">100 Enhancements</p>
            </button>

            <button
              onClick={() => handleDemoLogin('FREE')}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-left transition-colors"
            >
              <div className="font-bold">Free Plan</div>
              <p className="text-[10px] text-slate-400">Free Vault Access</p>
            </button>

            <button
              onClick={() => handleDemoLogin('ADMIN')}
              className="p-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-left transition-colors"
            >
              <div className="font-bold flex items-center justify-between">
                <span>Admin Console</span>
                <Shield className="w-3 h-3" />
              </div>
              <p className="text-[10px] text-purple-200/70">Full Moderation</p>
            </button>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
            className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

      </div>
    </div>
  );
};
