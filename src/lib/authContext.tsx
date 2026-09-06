import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminPermissions, MonthlyUsage, SubscriptionPlan, User } from '../types';
import { api } from './api';
import confetti from 'canvas-confetti';
import { 
  auth, 
  signInWithGoogle as fbSignInWithGoogle, 
  logOutFromFirebase, 
  toggleFavoriteFirestore, 
  syncUserProfile 
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const OWNER_SUPERADMIN_EMAIL = 'usagiptiktok@gmail.com';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManage: (permission: keyof AdminPermissions) => boolean;
  usage: MonthlyUsage | null;
  savedPromptIds: string[];
  login: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  quickSwitchUser: (preset: 'SUPER_ADMIN' | 'ADMIN' | 'STUDIO' | 'PRO' | 'FREE') => Promise<void>;
  upgradePlan: (newPlan: SubscriptionPlan) => Promise<void>;
  refreshUsage: () => Promise<void>;
  toggleFavorite: (promptId: string) => Promise<boolean>;
  isPromptSaved: (promptId: string) => boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pv_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default logged-in user for an instant working experience: Studio Creator
    return {
      uid: 'usr-studio',
      name: 'Maya Lin',
      email: 'creator@promptvault.ai',
      photoURL: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      role: 'user',
      plan: 'STUDIO',
      subscriptionStatus: 'active',
      createdAt: '2026-01-15',
      updatedAt: '2026-03-02'
    };
  });

  const [usage, setUsage] = useState<MonthlyUsage | null>(null);
  const [savedPromptIds, setSavedPromptIds] = useState<string[]>(['prompt-1', 'prompt-2']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const refreshUsage = async () => {
    if (!user) return;
    try {
      const u = await api.getUsage(user.uid);
      setUsage(u);
    } catch (e) {
      console.error('Failed to fetch usage', e);
    }
  };

  const refreshSaved = async () => {
    if (!user) return;
    try {
      const favs = await api.getFavorites(user.uid, user.plan);
      setSavedPromptIds(favs.map(f => f.id));
    } catch (e) {
      console.error('Failed to fetch favorites', e);
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('pv_user', JSON.stringify(user));
      refreshUsage();
      refreshSaved();
    } else {
      localStorage.removeItem('pv_user');
      setUsage(null);
      setSavedPromptIds([]);
    }
  }, [user?.uid, user?.plan]);

  const login = async (email: string) => {
    const res = await api.login(email);
    setUser(res.user);
    // Sync profile to Firestore asynchronously
    syncUserProfile(res.user).catch(() => {});
    showToast(`Welcome, ${res.user.name}!`);
  };

  const signInWithGoogle = async () => {
    try {
      const fbUser = await fbSignInWithGoogle();
      setUser(fbUser);
      showToast(`Welcome, ${fbUser.name}!`);
    } catch (err: any) {
      console.error('Google login failed:', err);
      // If popup was cancelled or failed, show friendly error
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast(err?.message || 'Google Sign-In failed');
      }
    }
  };

  const logout = () => {
    logOutFromFirebase().catch(() => {});
    setUser(null);
    showToast('Logged out of Prompt Vault');
  };

  const quickSwitchUser = async (preset: 'SUPER_ADMIN' | 'ADMIN' | 'STUDIO' | 'PRO' | 'FREE') => {
    const emails = {
      SUPER_ADMIN: OWNER_SUPERADMIN_EMAIL,
      ADMIN: 'admin@promptvault.ai',
      STUDIO: 'creator@promptvault.ai',
      PRO: 'pro@promptvault.ai',
      FREE: 'alex@example.com'
    };
    await login(emails[preset]);
  };

  const isSuperAdmin = user?.email.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase() || user?.role === 'superadmin' || !!user?.isSuperAdmin;
  const isAdmin = isSuperAdmin || user?.role === 'admin';

  const canManage = (permission: keyof AdminPermissions): boolean => {
    if (isSuperAdmin) return true;
    if (!isAdmin) return false;
    if (!user?.adminPermissions) return true; // Default admin has general permissions
    return !!user.adminPermissions[permission];
  };

  const upgradePlan = async (newPlan: SubscriptionPlan) => {
    if (!user) {
      showToast('Please sign in to choose a plan');
      return;
    }
    const updated = await api.updateUser(user.uid, { plan: newPlan });
    setUser(updated);
    syncUserProfile(updated).catch(() => {});
    showToast(`Switched plan to ${newPlan}!`);

    // Celebratory confetti animation on upgrade
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      // safe fallback
    }
  };

  const toggleFavorite = async (promptId: string): Promise<boolean> => {
    if (!user) {
      showToast('Please sign in to save prompts to your vault');
      return false;
    }
    const res = await api.toggleFavorite(user.uid, promptId);
    toggleFavoriteFirestore(user.uid, promptId).catch(() => {});
    setSavedPromptIds(res.savedIds);
    if (res.isSaved) {
      showToast('Saved to My Vault!');
    } else {
      showToast('Removed from My Vault');
    }
    return res.isSaved;
  };

  const isPromptSaved = (promptId: string) => {
    return savedPromptIds.includes(promptId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        canManage,
        usage,
        savedPromptIds,
        login,
        signInWithGoogle,
        logout,
        quickSwitchUser,
        upgradePlan,
        refreshUsage,
        toggleFavorite,
        isPromptSaved,
        toastMessage,
        showToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
