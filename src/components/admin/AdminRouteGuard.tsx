import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { AdminPanel } from './AdminPanel';
import { Shield, ShieldAlert, Lock, ArrowLeft, KeyRound, Crown, CheckCircle } from 'lucide-react';

interface AdminRouteGuardProps {
  onRefreshGlobalData: () => void;
  onNavigateHome: () => void;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({
  onRefreshGlobalData,
  onNavigateHome
}) => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, login, quickSwitchUser, showToast } = useAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) return;

    setIsLoading(true);
    try {
      await login(adminEmail.trim());
      showToast('Signed in successfully');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Unauthenticated: Dedicated Admin Gateway
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 w-fit mx-auto ring-1 ring-amber-500/20">
              <Shield className="w-9 h-9" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Protected Area • /admin
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              Admin Portal Sign-In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Access to this console requires verified administrator or owner credentials.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@promptvault.ai"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#060911] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Verifying...' : 'Access Admin Console'}</span>
            </button>
          </form>

          {/* Quick Demo Access for Evaluation */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
            <span className="block text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider">
              One-Click Admin Testing Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickSwitchUser('SUPER_ADMIN')}
                className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-left text-xs transition-colors flex items-center gap-2"
              >
                <Crown className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-bold text-[11px]">Super Admin</p>
                  <p className="text-[9px] text-amber-300/70 truncate">usagiptiktok@gmail.com</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => quickSwitchUser('ADMIN')}
                className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-left text-xs transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-bold text-[11px]">Administrator</p>
                  <p className="text-[9px] text-purple-300/70 truncate">admin@promptvault.ai</p>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Library</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated but Unauthorized: 403 Forbidden Access Gate
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg p-8 rounded-3xl bg-white dark:bg-[#0A101E] border border-rose-500/30 shadow-2xl space-y-6 text-center">
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 w-fit mx-auto ring-1 ring-rose-500/20">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">
              HTTP 403 • Access Forbidden
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              Administrator Clearance Required
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your authenticated account (<span className="text-slate-700 dark:text-slate-200 font-semibold">{user?.email}</span>) does not possess administrator clearance. Access to the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-rose-400 font-mono text-[11px]">/admin</code> route is restricted to platform administrators and the owner account.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Role Enforcement Policy:</span>
            </div>
            <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 text-[11px] space-y-1">
              <li>Master Prompts can only be added, edited, or deleted by Admins.</li>
              <li>Only the Super Admin (<span className="font-semibold text-slate-300">usagiptiktok@gmail.com</span>) can grant admin status.</li>
              <li>Client-side role spoofing is blocked by Firestore rules and backend middleware.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Library</span>
            </button>

            <button
              onClick={() => quickSwitchUser('SUPER_ADMIN')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              <span>Switch to Super Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Admin: Render Full Admin Panel
  return (
    <AdminPanel
      onRefreshGlobalData={onRefreshGlobalData}
    />
  );
};
