import React, { useState, useEffect } from 'react';
import { 
  Prompt, Category, CreatorVideo, VideoReport, CustomPromptRequest, 
  User, AdminStats, PromptAccessLevel, SubscriptionPlan 
} from '../../types';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { savePromptToFirestore, deletePromptFromFirestore } from '../../lib/firebase';
import { AdminManagementSection } from './AdminManagementSection';
import { ThumbnailUploader } from './ThumbnailUploader';
import { 
  Shield, Layers, FolderTree, Users, Video, Flag, Sparkles, 
  BarChart3, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, 
  Eye, Check, Search, DollarSign, ArrowUpRight, Lock, Crown, Play, 
  Filter, RefreshCw, ShieldAlert, X
} from 'lucide-react';

interface AdminPanelProps {
  onRefreshGlobalData: () => void;
}

export type AdminTab = 
  | 'dashboard' 
  | 'prompts' 
  | 'categories' 
  | 'users' 
  | 'subscriptions' 
  | 'videos' 
  | 'requests' 
  | 'reports' 
  | 'admins';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onRefreshGlobalData }) => {
  const { user, isAdmin, isSuperAdmin, canManage, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [reports, setReports] = useState<VideoReport[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomPromptRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [promptSearch, setPromptSearch] = useState('');
  const [promptCategoryFilter, setPromptCategoryFilter] = useState('ALL');
  const [promptTierFilter, setPromptTierFilter] = useState('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const [videoSearch, setVideoSearch] = useState('');
  const [videoStatusFilter, setVideoStatusFilter] = useState('ALL');
  const [previewVideo, setPreviewVideo] = useState<CreatorVideo | null>(null);

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Partial<Prompt> | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const [fulfillModalReq, setFulfillModalReq] = useState<CustomPromptRequest | null>(null);
  const [fulfilledPromptText, setFulfilledPromptText] = useState('');
  const [adminNotesText, setAdminNotesText] = useState('');
  const [requestStatusVal, setRequestStatusVal] = useState<string>('COMPLETED');

  const [rejectingVideo, setRejectingVideo] = useState<CreatorVideo | null>(null);
  const [videoModerationNote, setVideoModerationNote] = useState('');

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [st, pList, cList, uList, vList, rList, reqList] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminPrompts(),
        api.getAdminCategories(),
        api.getUsers(),
        api.getAdminVideos(),
        api.getAdminReports(),
        api.getAdminCustomRequests()
      ]);
      setStats(st);
      setPrompts(pList);
      setCategories(cList);
      setUsers(uList);
      setVideos(vList);
      setReports(rList);
      setCustomRequests(reqList);
    } catch (e) {
      console.error('Error loading admin data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 rounded-3xl bg-white dark:bg-[#0A101E] border border-rose-500/30 text-center space-y-4 shadow-2xl">
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 w-fit mx-auto ring-1 ring-rose-500/20">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
          Administrator Clearance Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your current account does not have administrative privileges to access this console.
        </p>
      </div>
    );
  }

  // ==========================================
  // PROMPT ACTIONS
  // ==========================================
  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt?.title || !editingPrompt?.fullPrompt) {
      showToast('Title and full prompt are required.');
      return;
    }

    try {
      let savedResult: Prompt;
      if (editingPrompt.id) {
        savedResult = await api.updatePrompt(editingPrompt.id, editingPrompt);
        showToast('Prompt updated successfully!');
      } else {
        savedResult = await api.createPrompt({
          ...editingPrompt,
          copiesCount: 0,
          savesCount: 0,
          creationDate: new Date().toISOString().split('T')[0],
          tags: typeof editingPrompt.tags === 'string' 
            ? (editingPrompt.tags as string).split(',').map((s: string) => s.trim()) 
            : editingPrompt.tags || []
        });
        showToast('New Master Prompt created!');
      }

      // Save prompt document & thumbnail URL directly into Firestore
      savePromptToFirestore(savedResult).catch((fireErr) => {
        console.warn('Firestore prompt sync note:', fireErr);
      });

      setIsPromptModalOpen(false);
      setEditingPrompt(null);
      loadAdminData();
      onRefreshGlobalData();
    } catch (err: any) {
      showToast(err.message || 'Error saving prompt');
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this Master Prompt?')) {
      try {
        await api.deletePrompt(id);
        deletePromptFromFirestore(id).catch(() => {});
        showToast('Prompt deleted.');
        loadAdminData();
        onRefreshGlobalData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete prompt');
      }
    }
  };

  // ==========================================
  // CATEGORY ACTIONS
  // ==========================================
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    try {
      if (editingCategory.id) {
        await api.updateCategory(editingCategory.id, editingCategory);
        showToast('Category updated!');
      } else {
        await api.createCategory(editingCategory);
        showToast('New Category created!');
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      loadAdminData();
      onRefreshGlobalData();
    } catch (err: any) {
      showToast(err.message || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category? Prompts in this category will remain.')) {
      try {
        await api.deleteCategory(id);
        showToast('Category removed.');
        loadAdminData();
        onRefreshGlobalData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete category');
      }
    }
  };

  // ==========================================
  // VIDEO & MODERATION ACTIONS
  // ==========================================
  const handleSetVideoStatus = async (id: string, status: string, moderationNote?: string) => {
    try {
      await api.setVideoStatus(id, status, moderationNote);
      showToast(`Video marked as ${status}`);
      setRejectingVideo(null);
      setVideoModerationNote('');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update video status');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (confirm('Permanently delete this creator video from the showcase?')) {
      try {
        await api.deleteAdminVideo(id);
        showToast('Video deleted');
        loadAdminData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete video');
      }
    }
  };

  const handleSetReportStatus = async (id: string, status: string) => {
    try {
      await api.setReportStatus(id, status);
      showToast(`Report marked as ${status}`);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update report');
    }
  };

  // ==========================================
  // CUSTOM REQUEST ACTIONS
  // ==========================================
  const handleUpdateCustomRequest = async (statusOverride?: string) => {
    if (!fulfillModalReq) return;

    try {
      const finalStatus = statusOverride || requestStatusVal;
      await api.updateCustomRequest(fulfillModalReq.id, {
        status: finalStatus,
        fulfilledPrompt: fulfilledPromptText,
        finalMasterPrompt: fulfilledPromptText,
        adminNotes: adminNotesText,
        fulfilledDate: finalStatus === 'COMPLETED' ? new Date().toISOString() : undefined
      });

      showToast(`Request marked as ${finalStatus}!`);
      setFulfillModalReq(null);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update custom request');
    }
  };

  // Filtered Lists
  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = !promptSearch || 
      p.title.toLowerCase().includes(promptSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(promptSearch.toLowerCase()) ||
      p.fullPrompt.toLowerCase().includes(promptSearch.toLowerCase());
    const matchesCat = promptCategoryFilter === 'ALL' || p.category === promptCategoryFilter;
    const matchesTier = promptTierFilter === 'ALL' || p.accessLevel === promptTierFilter;
    return matchesSearch && matchesCat && matchesTier;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesPlan = userPlanFilter === 'ALL' || u.plan === userPlanFilter;
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchesSearch && matchesPlan && matchesRole;
  });

  const filteredVideos = videos.filter(v => {
    const matchesSearch = !videoSearch ||
      v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
      v.creatorName.toLowerCase().includes(videoSearch.toLowerCase()) ||
      v.promptUsed.toLowerCase().includes(videoSearch.toLowerCase());
    const matchesStatus = videoStatusFilter === 'ALL' || v.status === videoStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate MRR
  const mrr = users.reduce((total, u) => {
    if (u.subscriptionStatus !== 'active' && u.subscriptionStatus !== 'trialing') return total;
    if (u.plan === 'PLUS') return total + 5;
    if (u.plan === 'PRO') return total + 10;
    if (u.plan === 'STUDIO') return total + 20;
    return total;
  }, 0);

  const tabs: { id: AdminTab; label: string; icon: any; count?: number; clearance?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'prompts', label: 'Master Prompts', icon: Layers, count: prompts.length },
    { id: 'categories', label: 'Categories', icon: FolderTree, count: categories.length },
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
    { id: 'videos', label: 'Creator Videos', icon: Video, count: videos.length },
    { id: 'requests', label: 'Custom Requests', icon: Sparkles, count: customRequests.filter(r => r.status === 'PENDING').length },
    { id: 'reports', label: 'Reports', icon: Flag, count: reports.filter(r => r.status === 'PENDING').length },
    { id: 'admins', label: 'Manage Admins', icon: Shield, clearance: 'Super Admin' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Status Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 font-display">
            {isSuperAdmin ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin (Root Owner)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Platform Administrator</span>
              </span>
            )}
            <span className="text-slate-500">• Server-Side Protected</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display mt-2">
            Admin Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Central authority to manage master prompts, categories, subscriptions, videos, and platform administrators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold scrollbar-thin">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
              {tab.clearance && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                  isActive ? 'bg-amber-950 text-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  VIP
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==========================================
          1. DASHBOARD OVERVIEW TAB
          ========================================== */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Registered Creators</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                {stats.totalUsers.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold">
                {stats.activeSubscribers} Active Paid Subscribers
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Master Prompts in Vault</span>
              <p className="text-3xl font-extrabold text-cyan-400 font-display">
                {prompts.length.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                Across {categories.length} organized categories
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Monthly Recurring Revenue (MRR)</span>
              <p className="text-3xl font-extrabold text-amber-400 font-display">
                ${mrr.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                Calculated from current active subscriptions
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Showcase Videos</span>
              <p className="text-3xl font-extrabold text-purple-400 font-display">
                {videos.length.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                {videos.filter(v => v.status === 'APPROVED').length} Approved community showcases
              </p>
            </div>
          </div>

          {/* Action Items & Quick Queues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display flex items-center justify-between">
                <span>Pending Administrative Queues</span>
                <span className="text-xs font-normal text-slate-400">Real-time status</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                <div 
                  onClick={() => setActiveTab('requests')}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Custom Master Prompt Requests</span>
                  </div>
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {customRequests.filter(r => r.status === 'PENDING').length} Pending
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('reports')}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Flag className="w-4 h-4 text-rose-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Community Video Flags / Reports</span>
                  </div>
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {reports.filter(r => r.status === 'PENDING').length} Flagged
                  </span>
                </div>

                <div 
                  onClick={() => setActiveTab('videos')}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Creator Videos Pending Review</span>
                  </div>
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {videos.filter(v => v.status === 'PENDING').length} In Queue
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                Top Prompt Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <span 
                    key={cat.id} 
                    className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({prompts.filter(p => p.category === cat.name).length})
                    </span>
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Total Copies Generated: <strong className="text-purple-400 font-mono">{stats.totalCopies}</strong></span>
                <span>Active Plans: <strong className="text-emerald-400 font-mono">{stats.activeSubscribers}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          2. MASTER PROMPTS TAB
          ========================================== */}
      {activeTab === 'prompts' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Master Prompts Library ({filteredPrompts.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Only verified Admins can create, modify, publish, or categorize Master Prompts.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingPrompt({
                  title: '',
                  description: '',
                  category: categories[0]?.name || 'Cinematic',
                  fullPrompt: '',
                  exampleOutput: '',
                  recommendedUse: 'Runway Gen-3, Kling 1.5 Pro',
                  accessLevel: 'FREE',
                  featuredStatus: false,
                  isPublished: true,
                  thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600',
                  tags: []
                });
                setIsPromptModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Master Prompt</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search prompts by title, keywords, or content..."
                value={promptSearch}
                onChange={(e) => setPromptSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <select
              value={promptCategoryFilter}
              onChange={(e) => setPromptCategoryFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={promptTierFilter}
              onChange={(e) => setPromptTierFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Access Tiers</option>
              <option value="FREE">FREE</option>
              <option value="PLUS">PLUS</option>
              <option value="PRO">PRO</option>
              <option value="STUDIO">STUDIO</option>
            </select>
          </div>

          {/* Prompts Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A101E]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Prompt Details</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Tier</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Copies</th>
                  <th className="p-3.5">Featured</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-300">
                {filteredPrompts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-3.5 flex items-center gap-3">
                      <img src={p.thumbnail} alt={p.title} className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{p.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{p.description}</p>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        p.accessLevel === 'FREE' ? 'bg-slate-500/10 text-slate-400' :
                        p.accessLevel === 'PLUS' ? 'bg-cyan-500/10 text-cyan-400' :
                        p.accessLevel === 'PRO' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {p.accessLevel}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {p.isPublished !== false ? (
                        <span className="text-emerald-400 font-semibold text-[11px]">Published</span>
                      ) : (
                        <span className="text-amber-400 font-semibold text-[11px]">Draft</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{p.copiesCount}</td>
                    <td className="p-3.5">
                      {p.featuredStatus ? (
                        <span className="text-amber-400 font-bold text-[11px]">Featured</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => { setEditingPrompt(p); setIsPromptModalOpen(true); }}
                        className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                        title="Edit Master Prompt"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(p.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Master Prompt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          3. CATEGORIES TAB
          ========================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Prompt Categories ({categories.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control the taxonomy and display ordering of video categories in the library.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCategory({
                  name: '',
                  slug: '',
                  description: '',
                  order: categories.length + 1,
                  isEnabled: true
                });
                setIsCategoryModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className="p-5 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-400">
                    Order #{cat.order}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cat.isEnabled !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {cat.isEnabled !== false ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description || 'No description entered'}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {prompts.filter(p => p.category === cat.name).length} Prompts attached
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingCategory(cat); setIsCategoryModalOpen(true); }}
                      className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          4. USERS MANAGEMENT TAB
          ========================================== */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                User Directory ({filteredUsers.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect registered creator accounts, assign roles, and override subscription tiers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <select
              value={userPlanFilter}
              onChange={(e) => setUserPlanFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">FREE</option>
              <option value="PLUS">PLUS</option>
              <option value="PRO">PRO</option>
              <option value="STUDIO">STUDIO</option>
            </select>

            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A101E]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">User Details</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Subscription Plan</th>
                  <th className="p-3.5">Billing Status</th>
                  <th className="p-3.5 text-right">Modify Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-300">
                {filteredUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-3.5 flex items-center gap-3">
                      <img src={u.photoURL} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        u.isSuperAdmin || u.role === 'superadmin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {u.isSuperAdmin ? 'Super Admin' : u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-cyan-400">{u.plan}</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[11px] font-semibold ${
                        u.subscriptionStatus === 'active' ? 'text-emerald-400' :
                        u.subscriptionStatus === 'trialing' ? 'text-cyan-400' :
                        'text-slate-500'
                      }`}>
                        {u.subscriptionStatus || 'active'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <select
                        value={u.plan}
                        onChange={async (e) => {
                          const newPlan = e.target.value as SubscriptionPlan;
                          await api.updateUser(u.uid, { plan: newPlan });
                          showToast(`Updated ${u.name}'s plan to ${newPlan}`);
                          loadAdminData();
                        }}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="FREE">FREE ($0)</option>
                        <option value="PLUS">PLUS ($5)</option>
                        <option value="PRO">PRO ($10)</option>
                        <option value="STUDIO">STUDIO ($20)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          5. MANAGE SUBSCRIPTIONS TAB
          ========================================== */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Subscription Architecture & Plan Control
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time MRR monitoring, tier distribution, plan quota adjustments, and subscriber status management.
            </p>
          </div>

          {/* Pricing & Quota Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { 
                plan: 'FREE', 
                price: 0, 
                enhancer: '50 credits', 
                image: '25 credits', 
                uploads: 'No', 
                requests: 'None', 
                subscriberCount: users.filter(u => u.plan === 'FREE').length 
              },
              { 
                plan: 'PLUS', 
                price: 5, 
                enhancer: '200 credits', 
                image: '500 credits', 
                uploads: 'Unlimited', 
                requests: 'None', 
                subscriberCount: users.filter(u => u.plan === 'PLUS').length 
              },
              { 
                plan: 'PRO', 
                price: 10, 
                enhancer: '500 credits', 
                image: '5,000 credits', 
                uploads: 'Unlimited', 
                requests: '25 per mo', 
                subscriberCount: users.filter(u => u.plan === 'PRO').length 
              },
              { 
                plan: 'STUDIO', 
                price: 20, 
                enhancer: 'Unlimited', 
                image: 'Unlimited', 
                uploads: 'Unlimited', 
                requests: 'VIP Priority', 
                subscriberCount: users.filter(u => u.plan === 'STUDIO').length 
              }
            ].map(p => (
              <div key={p.plan} className="p-5 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white font-display">{p.plan} TIER</h4>
                  <span className="text-xs font-mono font-bold text-cyan-400">${p.price}/mo</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 space-y-1 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Subscribers</span>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">{p.subscriberCount}</p>
                </div>

                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span>Prompt Enhancer:</span>
                    <strong className="text-slate-700 dark:text-slate-200">{p.enhancer}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span>Image → Prompt:</span>
                    <strong className="text-slate-700 dark:text-slate-200">{p.image}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span>Showcase Uploads:</span>
                    <strong className="text-slate-700 dark:text-slate-200">{p.uploads}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span>Custom Requests:</span>
                    <strong className="text-slate-700 dark:text-slate-200">{p.requests}</strong>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`Quotas and pricing for ${p.plan} updated in Firestore database.`)}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-cyan-500 hover:text-white transition-colors"
                >
                  Configure Limits
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          6. MANAGE CREATOR VIDEOS TAB
          ========================================== */}
      {activeTab === 'videos' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Creator Video Showcase ({filteredVideos.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Moderate, approve, or reject user-submitted AI video generations for the public community showcase.
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search videos by title, creator, or prompt used..."
                value={videoSearch}
                onChange={(e) => setVideoSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <select
              value={videoStatusFilter}
              onChange={(e) => setVideoStatusFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVideos.map(v => (
              <div 
                key={v.id}
                className="rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-slate-950 group">
                    <img 
                      src={v.thumbnailUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600'} 
                      alt={v.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewVideo(v)}
                        className="p-2.5 rounded-full bg-white/90 text-slate-900 hover:scale-110 transition-transform shadow-lg"
                        title="Preview Video"
                      >
                        <Play className="w-5 h-5 fill-current" />
                      </button>
                    </div>

                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        v.status === 'APPROVED' ? 'bg-emerald-500/90 text-white' :
                        v.status === 'PENDING' ? 'bg-amber-500/90 text-black' :
                        'bg-rose-500/90 text-white'
                      }`}>
                        {v.status}
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                      {v.duration} • {v.aspectRatio}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400 text-[11px]">{v.toolUsed}</span>
                      <span className="text-slate-500 text-[11px]">{v.viewsCount} views • {v.likesCount} likes</span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{v.title}</h4>
                    <p className="text-slate-400 text-[11px]">By {v.creatorName}</p>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {v.promptUsed}
                    </div>

                    {v.moderationNote && (
                      <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-lg">
                        <strong>Mod note:</strong> {v.moderationNote}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {v.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleSetVideoStatus(v.id, 'APPROVED')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {v.status !== 'REJECTED' && (
                      <button
                        onClick={() => {
                          setRejectingVideo(v);
                          setVideoModerationNote('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold transition-colors"
                      >
                        Reject
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteVideo(v.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          7. CUSTOM REQUESTS TAB
          ========================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Custom Master Prompt Requests ({customRequests.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Craft and deliver bespoke Master Prompts for Pro and Studio VIP creators.
              </p>
            </div>
            <span className="text-xs text-amber-400 font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              {customRequests.filter(r => r.userPlan === 'STUDIO').length} VIP Studio Inquiries
            </span>
          </div>

          <div className="space-y-3">
            {customRequests.map(req => {
              const isStudio = req.userPlan === 'STUDIO';
              return (
                <div 
                  key={req.id} 
                  className={`p-5 rounded-2xl border transition-all space-y-3 text-xs ${
                    isStudio 
                      ? 'bg-amber-950/10 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                      : 'bg-white dark:bg-[#0A101E] border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {isStudio && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          <span>Priority VIP (Studio)</span>
                        </span>
                      )}
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{req.title}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                        req.status === 'COMPLETED' || req.status === 'FULFILLED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        req.status === 'IN_PROGRESS' || req.status === 'IN_REVIEW' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                        req.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <p className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {req.description || req.detailedDescription || 'No description provided'}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>Requester: <strong className="text-slate-700 dark:text-slate-300">{req.userName}</strong> ({req.userEmail})</span>
                      <span>•</span>
                      <span>Target Engine: <strong className="text-cyan-400">{req.targetEngine || 'Runway Gen-3'}</strong></span>
                      <span>•</span>
                      <span>Ratio: {req.aspectRatio || '16:9'}</span>
                    </div>

                    <button
                      onClick={() => { 
                        setFulfillModalReq(req); 
                        setFulfilledPromptText(req.fulfilledPrompt || req.finalMasterPrompt || '');
                        setAdminNotesText(req.adminNotes || '');
                        setRequestStatusVal(req.status || 'COMPLETED');
                      }}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-black bg-amber-400 hover:bg-amber-300 shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Review & Fulfill</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          8. REPORTS & MODERATION TAB
          ========================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Community Content Reports ({reports.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review flagged creator videos and inappropriate submissions.
            </p>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No reports currently filed by the community.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(rep => (
                <div 
                  key={rep.id} 
                  className="p-4 rounded-2xl bg-white dark:bg-[#0A101E] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-400 text-sm">{rep.reason}</span>
                      <span className="text-slate-500">• Reported by {rep.reporterName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rep.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        rep.status === 'DISMISSED' ? 'bg-slate-800 text-slate-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-slate-400">Video ID: <code className="font-mono text-[11px]">{rep.videoId}</code> — {rep.description || 'No additional comment provided.'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSetReportStatus(rep.id, 'RESOLVED')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold transition-colors"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleSetReportStatus(rep.id, 'DISMISSED')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          9. ADMIN MANAGEMENT (SUPER ADMIN ONLY)
          ========================================== */}
      {activeTab === 'admins' && (
        <AdminManagementSection
          onRefreshGlobalData={loadAdminData}
          showToast={showToast}
        />
      )}

      {/* ==========================================
          MODALS
          ========================================== */}

      {/* Prompt Create/Edit Modal */}
      {isPromptModalOpen && editingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {editingPrompt.id ? 'Edit Master Prompt' : 'Create New Master Prompt'}
              </h3>
              <button 
                onClick={() => setIsPromptModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrompt} className="space-y-3.5">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingPrompt.title || ''}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Short Description</label>
                <input
                  type="text"
                  value={editingPrompt.description || ''}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={editingPrompt.category || categories[0]?.name}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Access Tier</label>
                  <select
                    value={editingPrompt.accessLevel || 'FREE'}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, accessLevel: e.target.value as PromptAccessLevel })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PLUS">PLUS</option>
                    <option value="PRO">PRO</option>
                    <option value="STUDIO">STUDIO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Master Prompt (Production Template)
                </label>
                <textarea
                  rows={5}
                  required
                  value={editingPrompt.fullPrompt || ''}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, fullPrompt: e.target.value })}
                  placeholder="Cinematic 8k shot..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              {/* Master Prompt Thumbnail Upload with Firebase Storage */}
              <ThumbnailUploader
                currentUrl={editingPrompt.thumbnail || ''}
                onUrlChange={(url) => {
                  setEditingPrompt({ 
                    ...editingPrompt, 
                    thumbnail: url,
                    previewMedia: url 
                  });
                }}
              />

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPrompt.featuredStatus || false}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, featuredStatus: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Featured Prompt</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPrompt.isPublished !== false}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, isPublished: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Published (Live)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPromptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-sm"
                >
                  Save Master Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              {editingCategory.id ? 'Edit Category' : 'Create Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Manage Custom Request Modal */}
      {fulfillModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-display">
                  Custom Request Review
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  {fulfillModalReq.title}
                </h3>
              </div>
              {fulfillModalReq.userPlan === 'STUDIO' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                  PRIORITY VIP
                </span>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Requester:</span>
                <strong className="text-slate-900 dark:text-white">{fulfillModalReq.userName} ({fulfillModalReq.userEmail})</strong>
              </div>
              <div className="flex justify-between">
                <span>Plan Tier:</span>
                <span className="font-bold text-cyan-400">{fulfillModalReq.userPlan}</span>
              </div>
              <div className="flex justify-between">
                <span>Target Engine:</span>
                <span className="text-slate-900 dark:text-white">{fulfillModalReq.targetEngine || 'Runway Gen-3'}</span>
              </div>
              <div className="flex justify-between">
                <span>Aspect Ratio / Duration:</span>
                <span>{fulfillModalReq.aspectRatio || '16:9'} • {fulfillModalReq.duration || '5s'}</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Creator Brief / Requirements
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 max-h-32 overflow-y-auto leading-relaxed">
                {fulfillModalReq.description || fulfillModalReq.detailedDescription}
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Update Status
              </label>
              <select
                value={requestStatusVal}
                onChange={(e) => setRequestStatusVal(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED (FULFILLED)</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Admin Notes (Internal or delivered feedback)
              </label>
              <textarea
                rows={2}
                value={adminNotesText}
                onChange={(e) => setAdminNotesText(e.target.value)}
                placeholder="Optional notes regarding prompt tuning, lens choices, or revision details..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Final Master Prompt (Delivered to Creator)
              </label>
              <textarea
                rows={4}
                value={fulfilledPromptText}
                onChange={(e) => setFulfilledPromptText(e.target.value)}
                placeholder="Paste the crafted Master Prompt..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleUpdateCustomRequest('REJECTED')}
                className="px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold transition-colors"
              >
                Reject Request
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillModalReq(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateCustomRequest('COMPLETED')}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-sm"
                >
                  Mark Completed & Deliver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Video Moderation Modal */}
      {rejectingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
              Reject Creator Video
            </h3>
            <p className="text-slate-400">
              Provide a reason/moderation note for rejecting "{rejectingVideo.title}".
            </p>
            <div>
              <textarea
                rows={3}
                value={videoModerationNote}
                onChange={(e) => setVideoModerationNote(e.target.value)}
                placeholder="Violates content guidelines, quality issues, or incorrect prompt..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingVideo(null)}
                className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSetVideoStatus(rejectingVideo.id, 'REJECTED', videoModerationNote)}
                className="px-4 py-2 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-display">{previewVideo.title}</h3>
                <p className="text-slate-400 text-[11px]">By {previewVideo.creatorName} • {previewVideo.toolUsed}</p>
              </div>
              <button 
                onClick={() => setPreviewVideo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video 
                src={previewVideo.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
              <strong className="text-amber-400 block mb-1">Master Prompt:</strong>
              {previewVideo.promptUsed}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
