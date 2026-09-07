import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminPermissions, MonthlyUsage, SubscriptionPlan, User } from '../types';
import { api } from './api';
import confetti from 'canvas-confetti';
import { 
  auth, 
  signInWithGoogle as fbSignInWithGoogle, 
  signUpWithEmail as fbSignUpWithEmail,
  loginWithEmail as fbLoginWithEmail,
  getUserProfile,
  logOutFromFirebase, 
  toggleFavoriteFirestore, 
  syncUserProfile,
  requestSubscriptionFirestore,
  approveSubscriptionFirestore,
  OWNER_SUPERADMIN_EMAIL
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManage: (permission: keyof AdminPermissions) => boolean;
  usage: MonthlyUsage | null;
  savedPromptIds: string[];
  login: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  upgradePlan: (newPlan: SubscriptionPlan) => Promise<void>;
  adminApproveUserPlan: (targetUserId: string, plan: SubscriptionPlan) => Promise<void>;
  refreshUsage: () => Promise<void>;
  toggleFavorite: (promptId: string) => Promise<boolean>;
  isPromptSaved: (promptId: string) => boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isLoadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [usage, setUsage] = useState<MonthlyUsage | null>(null);
  const [savedPromptIds, setSavedPromptIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshUsage = async () => {
    if (!user) return;
    try {
      const u = await api.getUsage(user.uid);
      setUsage(u);
    } catch (e) {
      // safe fallback
    }
  };

  const refreshSaved = async () => {
    if (!user) return;
    try {
      const favs = await api.getFavorites(user.uid, user.plan);
      setSavedPromptIds(favs.map(f => f.id));
    } catch (e) {
      // safe fallback
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    let unsubscribe: () => void;

    const initAuth = async () => {
      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
          // No user signed in: clear user state
          setUser(null);
          setIsLoadingAuth(false);
          return;
        }

        // Authenticated Firebase User
        try {
          const profile = await getUserProfile(fbUser.uid);
          const isOwner = fbUser.email?.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase();

          if (profile) {
            // Guard: If it's the owner, ensure superadmin + studio plan
            if (isOwner && profile.role !== 'superadmin') {
              profile.role = 'superadmin';
              profile.isSuperAdmin = true;
              profile.plan = 'STUDIO';
            }
            // For any normal user, verify plan is never spontaneously elevated
            if (!isOwner && profile.role === 'superadmin') {
              profile.role = 'user';
              profile.isSuperAdmin = false;
            }
            setUser(profile);
          } else {
            // Document doesn't exist yet in Firestore
            const newUserProfile: User = {
              uid: fbUser.uid,
              name: fbUser.displayName || (fbUser.email?.split('@')[0] || 'Creator'),
              email: fbUser.email || '',
              photoURL: fbUser.photoURL || undefined,
              isAnonymous: false,
              role: isOwner ? 'superadmin' : 'user',
              isSuperAdmin: isOwner,
              plan: isOwner ? 'STUDIO' : 'FREE',
              subscriptionStatus: isOwner ? 'active' : 'none',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0]
            };
            await syncUserProfile(newUserProfile).catch(() => {});
            setUser(newUserProfile);
          }
        } catch (err) {
          console.error('Failed to resolve Firebase user document:', err);
        } finally {
          setIsLoadingAuth(false);
        }
      });
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync usage and saved prompts whenever user UID or plan updates
  useEffect(() => {
    if (user?.uid) {
      // Save local cache strictly scoped to THIS user's UID to prevent cross-account leakage
      try {
        localStorage.setItem(`pv_user_cache_${user.uid}`, JSON.stringify(user));
      } catch (e) {
        // ignore
      }
      refreshUsage();
      refreshSaved();
    } else {
      setUsage(null);
      setSavedPromptIds([]);
    }
  }, [user?.uid, user?.plan]);

  // Sign in with Email / Password
  const login = async (email: string, password?: string) => {
    try {
      let loggedUser: User;
      if (password) {
        loggedUser = await fbLoginWithEmail(email, password);
      } else {
        // Fallback for simple email flow
        const res = await api.login(email);
        loggedUser = res.user;
        await syncUserProfile(loggedUser).catch(() => {});
      }
      setUser(loggedUser);
      showToast(`Welcome back, ${loggedUser.name}!`);
    } catch (err: any) {
      console.error('Login error:', err);
      showToast(err.message || 'Login failed. Please check credentials.');
      throw err;
    }
  };

  // Sign Up / Create Account (Upgrades Guest to Permanent Account)
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const newUser = await fbSignUpWithEmail(email, password, name);
      setUser(newUser);
      showToast(`Account created! Welcome to Prompt Vault, ${newUser.name}.`);
    } catch (err: any) {
      console.error('Sign up error:', err);
      showToast(err.message || 'Account creation failed.');
      throw err;
    }
  };

  // Continue with Google (Links guest or signs in)
  const signInWithGoogle = async () => {
    try {
      const fbUser = await fbSignInWithGoogle();
      setUser(fbUser);
      showToast(`Welcome, ${fbUser.name}!`);
    } catch (err: any) {
      console.error('Google login failed:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast(err?.message || 'Google Sign-In failed');
      }
      throw err;
    }
  };

  // Logout: Call Firebase signOut(auth), clear the auth state, and redirect to the Login page
  const logout = async () => {
    try {
      await logOutFromFirebase();
      setUser(null);
      setUsage(null);
      setSavedPromptIds([]);

      // Clear user-specific cached items from storage
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('pv_user_cache_') || key === 'pv_cached_user')) {
            localStorage.removeItem(key);
          }
        }
        sessionStorage.clear();
      } catch (e) {
        // ignore
      }

      showToast('Signed out successfully.');

      // Redirect to the Login page
      if (typeof window !== 'undefined') {
        if (window.location.pathname !== '/login') {
          window.history.pushState({ tab: 'login' }, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  // Admin access validation: strictly derived from backend / Firebase authentication
  const isSuperAdmin = !user?.isAnonymous && (
    user?.email?.toLowerCase() === OWNER_SUPERADMIN_EMAIL.toLowerCase() || 
    user?.role === 'superadmin' || 
    !!user?.isSuperAdmin
  );
  
  const isAdmin = !user?.isAnonymous && (
    isSuperAdmin || 
    user?.role === 'admin'
  );

  const isGuest = !user || !!user.isAnonymous;

  const canManage = (permission: keyof AdminPermissions): boolean => {
    if (isSuperAdmin) return true;
    if (!isAdmin) return false;
    if (!user?.adminPermissions) return true;
    return !!user.adminPermissions[permission];
  };

  // Plan Selection / Upgrade:
  // Studio Plan ($20/mo) and Pro tiers require Admin approval for regular users!
  const upgradePlan = async (newPlan: SubscriptionPlan) => {
    if (!user) {
      showToast('Please sign in or create an account to choose a plan');
      return;
    }

    if (user.isAnonymous) {
      showToast('Please create a free account first to subscribe to a plan');
      return;
    }

    // If Admin/SuperAdmin, can switch directly
    if (isAdmin) {
      const updated = await api.updateUser(user.uid, { plan: newPlan });
      setUser(updated);
      syncUserProfile(updated).catch(() => {});
      showToast(`Admin: Switched plan to ${newPlan}`);
      return;
    }

    // Regular users: request plan approval from Admin
    try {
      await api.requestSubscription(user.uid, newPlan);
      await requestSubscriptionFirestore(user.uid, newPlan).catch(() => {});
      
      setUser(prev => prev ? { ...prev, subscriptionRequested: newPlan } : null);
      showToast(`Subscription requested for ${newPlan} plan! The Admin will review and activate your membership.`);
      
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit subscription request');
    }
  };

  // Admin approves a user's subscription
  const adminApproveUserPlan = async (targetUserId: string, plan: SubscriptionPlan) => {
    if (!isAdmin) {
      showToast('Unauthorized: Only administrators can approve subscriptions.');
      return;
    }
    try {
      await api.approveSubscription(targetUserId, plan);
      await approveSubscriptionFirestore(targetUserId, plan).catch(() => {});
      showToast(`Approved ${plan} plan for user ${targetUserId}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to approve subscription');
    }
  };

  const toggleFavorite = async (promptId: string): Promise<boolean> => {
    if (!user) {
      showToast('Please create an account to save prompts');
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
        isAuthenticated: !!user && !user.isAnonymous,
        isGuest,
        isAdmin,
        isSuperAdmin,
        canManage,
        usage,
        savedPromptIds,
        login,
        signUp,
        signInWithGoogle,
        logout,
        upgradePlan,
        adminApproveUserPlan,
        refreshUsage,
        toggleFavorite,
        isPromptSaved,
        toastMessage,
        showToast,
        isLoadingAuth
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
