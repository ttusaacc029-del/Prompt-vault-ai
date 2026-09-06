import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../lib/authContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { 
  Sun, Moon, Search, Sparkles, FolderLock, Video, DollarSign, 
  LayoutDashboard, User as UserIcon, Shield, LogOut, Menu, X, 
  ChevronDown, Crown, Layers, Zap, Settings
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAuth,
  onOpenSettings
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isGuest, isAdmin, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'prompts', label: 'Prompts', icon: Layers },
    { id: 'ai-tools', label: 'AI Tools', icon: Sparkles },
    { id: 'showcase', label: 'Showcase', icon: Video },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
  ];

  const planColors: Record<string, string> = {
    FREE: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    PLUS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    PRO: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    STUDIO: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#070A12]/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <button
          id="nav-logo-btn"
          onClick={() => { setActiveTab('landing'); setIsMobileMenuOpen(false); }}
          className="flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
        >
          <Logo size="md" />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                id={`nav-link-${link.id}`}
                onClick={() => setActiveTab(link.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 opacity-80" />
                <span>{link.label}</span>
              </button>
            );
          })}

          {isAuthenticated && (
            <button
              id="nav-link-my-vault"
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'vault'
                  ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <FolderLock className="w-4 h-4 opacity-80" />
              <span>My Vault</span>
            </button>
          )}

          {isAdmin && (
            <button
              id="nav-link-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40'
                  : 'text-amber-600 dark:text-amber-400/90 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Right Action Icons & Auth Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Search Button */}
          <button
            id="nav-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 hover:border-cyan-500/50 transition-colors"
            title="Search Master Prompts (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Search prompts...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px]">⌘K</kbd>
          </button>

          {/* Notifications Dropdown (Section 51) */}
          <NotificationDropdown onNavigateTab={setActiveTab} />

          {/* Theme Toggle */}
          <button
            id="nav-theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* User Logged In Profile OR Guest / Sign Up Controls */}
          {isAuthenticated && !isGuest && user ? (
            <div className="relative">
              <button
                id="nav-profile-menu-btn"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-slate-200 dark:border-slate-700/80 hover:border-cyan-500/60 bg-slate-50 dark:bg-slate-900/60 transition-colors"
              >
                <img
                  src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-cyan-500/40"
                />
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${planColors[user.plan] || planColors.FREE}`}>
                  {user.plan}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-[#0B1120] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('dashboard'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Dashboard & Usage</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('vault'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center gap-2"
                  >
                    <FolderLock className="w-3.5 h-3.5 text-blue-500" />
                    <span>My Vault</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('requests'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Custom Requests</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('pricing'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center gap-2"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Subscription & Billing</span>
                  </button>
                  <button
                    onClick={() => { if (onOpenSettings) onOpenSettings(); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Profile & Settings</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { setActiveTab('admin'); setIsProfileMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Control Panel</span>
                    </button>
                  )}
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={() => { logout(); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Guest (Free)
              </span>
              <button
                id="nav-login-btn"
                onClick={() => onOpenAuth('login')}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              >
                Sign In
              </button>
              <button
                id="nav-signup-btn"
                onClick={() => onOpenAuth('signup')}
                className="px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1"
              >
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080D18] px-4 pt-3 pb-5 space-y-2">
          {navLinks.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => { setActiveTab(link.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  activeTab === link.id
                    ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                <span>{link.label}</span>
              </button>
            );
          })}

          {isAuthenticated && (
            <>
              <button
                onClick={() => { setActiveTab('vault'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  activeTab === 'vault'
                    ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <FolderLock className="w-4 h-4 text-blue-400" />
                <span>My Vault</span>
              </button>
              <button
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                <span>Dashboard & Usage</span>
              </button>
              <button
                onClick={() => { setActiveTab('requests'); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Custom Requests</span>
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
