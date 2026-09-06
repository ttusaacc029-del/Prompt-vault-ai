import React, { useState, useMemo } from 'react';
import { Category, Prompt, PromptAccessLevel, SubscriptionPlan } from '../../types';
import { useAuth } from '../../lib/authContext';
import { 
  Search, Filter, Lock, Unlock, Copy, Check, FolderLock, 
  Sparkles, Star, ChevronDown, SlidersHorizontal, Eye, Tag
} from 'lucide-react';

interface PromptLibraryProps {
  prompts: Prompt[];
  categories: Category[];
  onSelectPrompt: (prompt: Prompt) => void;
  onOpenPricing: () => void;
  initialCategory?: string;
  initialSearch?: string;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({
  prompts,
  categories,
  onSelectPrompt,
  onOpenPricing,
  initialCategory = 'all',
  initialSearch = ''
}) => {
  const { user, toggleFavorite, isPromptSaved, showToast } = useAuth();
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'popular'>('featured');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter & sort logic
  const filteredPrompts = useMemo(() => {
    let list = [...prompts];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Access level filter
    if (selectedAccessLevel !== 'all') {
      list = list.filter(p => p.accessLevel === selectedAccessLevel);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.recommendedUse.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'popular') {
      list.sort((a, b) => (b.copiesCount + b.savesCount) - (a.copiesCount + a.savesCount));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
    } else {
      // featured
      list.sort((a, b) => (b.featuredStatus ? 1 : 0) - (a.featuredStatus ? 1 : 0));
    }

    return list;
  }, [prompts, selectedCategory, selectedAccessLevel, searchQuery, sortBy]);

  const handleCopy = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    if (prompt.isLockedForUser) {
      showToast(`This prompt is locked. Upgrade to ${prompt.requiredPlan} to copy.`);
      return;
    }
    navigator.clipboard.writeText(prompt.fullPrompt);
    setCopiedId(prompt.id);
    showToast('Prompt copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getBadgeStyle = (level: PromptAccessLevel) => {
    switch (level) {
      case 'FREE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PLUS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'PRO':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'STUDIO':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-display">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Video Prompt Database</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
            Prompt Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Professionally engineered AI video prompts with variables, camera movement specs, and optics for Hollywood-grade generation.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="prompt-library-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, styles, tags..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All Categories ({prompts.length})
        </button>
        {categories.map(cat => {
          const count = prompts.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{cat.name}</span>
              {count > 0 && (
                <span className="text-[10px] opacity-70 bg-black/20 px-1 rounded-full">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Controls Bar: Access Filter & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-y border-slate-100 dark:border-slate-800/60 text-xs">
        
        {/* Tier filter tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 mr-1 hidden sm:inline">Access:</span>
          {['all', 'FREE', 'PLUS', 'PRO', 'STUDIO'].map(level => (
            <button
              key={level}
              onClick={() => setSelectedAccessLevel(level)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedAccessLevel === level
                  ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {level === 'all' ? 'All Tiers' : level}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="featured" className="dark:bg-slate-900">Featured First</option>
            <option value="newest" className="dark:bg-slate-900">Newest Added</option>
            <option value="popular" className="dark:bg-slate-900">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Prompts Grid */}
      {filteredPrompts.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No Master Prompts match your filter criteria.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedAccessLevel('all'); }}
            className="text-xs font-bold text-cyan-500 hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPrompts.map(prompt => {
            const isLocked = prompt.isLockedForUser;
            return (
              <div
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt)}
                className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#090F1C] overflow-hidden hover:border-cyan-500/50 hover:shadow-xl transition-all flex flex-col justify-between relative"
              >
                {/* Media preview */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                  <img
                    src={prompt.thumbnail}
                    alt={prompt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${getBadgeStyle(prompt.accessLevel)}`}>
                      {prompt.accessLevel}
                    </span>
                    {prompt.featuredStatus && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-white flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>

                  {/* Lock Indicator Overlay if User cannot view full content */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
                      <div className="p-2.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-2">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">
                        Requires {prompt.requiredPlan}
                      </span>
                      <span className="text-[10px] text-slate-300 mt-0.5">
                        Click to view upgrade options
                      </span>
                    </div>
                  )}

                  {/* Category Pill on bottom */}
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/70 text-slate-200 backdrop-blur-md">
                      {prompt.category}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-400 font-display">
                      {prompt.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {prompt.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {prompt.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom / Action Row */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {prompt.copiesCount.toLocaleString()} copies
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(prompt.id); }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isPromptSaved(prompt.id)
                            ? 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
                            : 'text-slate-400 border-slate-200 dark:border-slate-700 hover:text-white'
                        }`}
                        title="Save to My Vault"
                      >
                        <FolderLock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleCopy(e, prompt)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isLocked
                            ? 'text-slate-500 border-slate-800 bg-slate-900/50 cursor-not-allowed'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                        }`}
                        title={isLocked ? `Locked (${prompt.requiredPlan})` : 'Copy prompt'}
                      >
                        {copiedId === prompt.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isLocked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
