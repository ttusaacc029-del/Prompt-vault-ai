import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { Logo } from '../common/Logo';
import { Mail, Lock, User as UserIcon, ArrowRight, LogIn, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onSuccess?: () => void;
  onNavigateHome?: () => void;
  initialMode?: 'login' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateHome,
  initialMode = 'login'
}) => {
  const { user, isAuthenticated, login, signUp, signInWithGoogle, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to library/dashboard after a moment
  useEffect(() => {
    if (isAuthenticated && user) {
      const timer = setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else if (typeof window !== 'undefined') {
          window.history.pushState({ tab: 'prompts' }, '', '/prompts');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, onSuccess]);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      if (onSuccess) {
        onSuccess();
      } else if (typeof window !== 'undefined') {
        window.history.pushState({ tab: 'prompts' }, '', '/prompts');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (err: any) {
      console.error('Google sign in error', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err?.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      if (onSuccess) {
        onSuccess();
      } else if (typeof window !== 'undefined') {
        window.history.pushState({ tab: 'prompts' }, '', '/prompts');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err?.message || 'Authentication failed. Please check your credentials.';
      if (err?.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please try again.';
      } else if (err?.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please create an account first.';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already authenticated
  if (isAuthenticated && user) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-xl p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              You are signed in
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Logged in as <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span> ({user.email})
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                if (onSuccess) onSuccess();
                else if (typeof window !== 'undefined') {
                  window.history.pushState({ tab: 'prompts' }, '', '/prompts');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="w-full py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 text-xs transition-all"
            >
              Go to Prompt Library
            </button>
            <button
              onClick={async () => {
                await logout();
              }}
              className="w-full py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:py-12">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Logo size="md" className="justify-center" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display pt-2">
            {mode === 'login' ? 'Sign In to Prompt Vault' : 'Create Your Account'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {mode === 'login'
              ? 'Access your personal vault, saved video prompts, and AI tools.'
              : 'Sign up for free and unlock AI-powered video master prompts.'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Authentication */}
        <div className="space-y-3">
          <button
            type="button"
            id="login-google-btn"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl font-medium text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center gap-2.5 text-xs shadow-sm hover:shadow disabled:opacity-50"
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

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
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
                id="login-email-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@promptvault.ai"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                id="login-password-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>
              {isSubmitting 
                ? 'Processing...' 
                : mode === 'login' 
                  ? 'Sign In' 
                  : 'Create Personal Account'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            id="login-toggle-mode-btn"
            onClick={() => {
              setErrorMessage(null);
              setMode(m => m === 'login' ? 'signup' : 'login');
            }}
            className="text-xs text-slate-500 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
          >
            {mode === 'login' 
              ? "Don't have an account yet? Create one for Free" 
              : 'Already have an account? Sign In'}
          </button>
        </div>

      </div>
    </div>
  );
};
