import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './lib/themeContext';
import { AuthProvider, useAuth } from './lib/authContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { PromptLibrary } from './components/prompts/PromptLibrary';
import { PromptDetailModal } from './components/prompts/PromptDetailModal';
import { AIToolsHub } from './components/tools/AIToolsHub';
import { CreatorShowcase } from './components/showcase/CreatorShowcase';
import { PricingPage } from './components/pricing/PricingPage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminRouteGuard } from './components/admin/AdminRouteGuard';
import { SearchModal } from './components/common/SearchModal';
import { AuthModal } from './components/common/AuthModal';
import { ProfileSettingsModal } from './components/profile/ProfileSettingsModal';
import { Prompt, Category, CreatorVideo } from './types';
import { api } from './lib/api';
import { Sparkles, Check, AlertCircle } from 'lucide-react';

function AppContent() {
  const { user, toastMessage, upgradePlan } = useAuth();

  // Navigation State with URL synchronization
  const getInitialTab = () => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'admin') return 'admin';
    if (['prompts', 'ai-tools', 'showcase', 'pricing', 'vault', 'dashboard', 'requests'].includes(path)) {
      return path;
    }
    return 'landing';
  };

  const [activeTab, setActiveTabState] = useState<string>(getInitialTab);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    const newPath = tab === 'landing' ? '/' : `/${tab}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ tab }, '', newPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'admin') setActiveTabState('admin');
      else if (['prompts', 'ai-tools', 'showcase', 'pricing', 'vault', 'dashboard', 'requests'].includes(path)) {
        setActiveTabState(path);
      } else {
        setActiveTabState('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // Global Data
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cross-component communications
  const [enhancerInitialIdea, setEnhancerInitialIdea] = useState<string>('');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadAllData = async () => {
    try {
      const [pList, cList, vList] = await Promise.all([
        api.getPrompts({ userPlan: user?.plan }),
        api.getCategories(),
        api.getVideos()
      ]);
      setPrompts(pList);
      setCategories(cList);
      setVideos(vList);
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user?.plan]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleSendToEnhancer = (promptIdea: string) => {
    setEnhancerInitialIdea(promptIdea);
    setActiveTab('ai-tools');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-400 font-sans transition-colors">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={handleOpenAuth}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            prompts={prompts}
            videos={videos}
            setActiveTab={setActiveTab}
            onSelectPrompt={setSelectedPrompt}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeTab === 'prompts' && (
          <PromptLibrary
            prompts={prompts}
            categories={categories}
            onSelectPrompt={setSelectedPrompt}
            onOpenPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'ai-tools' && (
          <AIToolsHub
            initialIdea={enhancerInitialIdea}
            onOpenPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'showcase' && (
          <CreatorShowcase
            videos={videos}
            onRefreshVideos={loadAllData}
            onOpenPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingPage
            onPlanSelected={() => {
              loadAllData();
              setActiveTab('prompts');
            }}
          />
        )}

        {activeTab === 'vault' && (
          <UserDashboard
            initialSubTab="vault"
            onSelectPrompt={setSelectedPrompt}
            onOpenPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'dashboard' && (
          <UserDashboard
            initialSubTab="overview"
            onSelectPrompt={setSelectedPrompt}
            onOpenPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'requests' && (
          <UserDashboard
            initialSubTab="requests"
            onSelectPrompt={setSelectedPrompt}
            onOpenPricing={() => setActiveTab('pricing')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminRouteGuard
            onRefreshGlobalData={loadAllData}
            onNavigateHome={() => setActiveTab('landing')}
          />
        )}
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Global Modals */}
      {selectedPrompt && (
        <PromptDetailModal
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onOpenPricing={() => {
            setSelectedPrompt(null);
            setActiveTab('pricing');
          }}
          onSendToEnhancer={handleSendToEnhancer}
        />
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        prompts={prompts}
        onSelectPrompt={setSelectedPrompt}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenPricing={() => {
          setIsSettingsOpen(false);
          setActiveTab('pricing');
        }}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="px-4 py-2.5 rounded-xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700/50 dark:border-slate-200/50">
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
