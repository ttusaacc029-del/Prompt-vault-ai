import React, { useState, useEffect } from 'react';
import { Prompt } from '../../types';
import { Search, X, Layers, ArrowRight, Lock } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  prompts,
  onSelectPrompt
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = query.trim()
    ? prompts.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(query.toLowerCase())) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : prompts.slice(0, 4);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts by keyword, subject, lens, or category..."
            className="w-full px-3 py-4 text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-xs text-slate-400 hover:text-white mr-2">
              Clear
            </button>
          )}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-mono border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-96 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {query.trim() ? `Search Results (${results.length})` : 'Popular Master Prompts'}
          </div>

          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching Master Prompts found for "{query}".
            </div>
          ) : (
            results.map(prompt => (
              <div
                key={prompt.id}
                onClick={() => {
                  onSelectPrompt(prompt);
                  onClose();
                }}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={prompt.thumbnail}
                    alt={prompt.title}
                    className="w-11 h-11 rounded-lg object-cover shrink-0"
                  />
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-400">
                      {prompt.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {prompt.category} • {prompt.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    prompt.accessLevel === 'FREE' ? 'bg-emerald-500/10 text-emerald-400' :
                    prompt.accessLevel === 'PLUS' ? 'bg-blue-500/10 text-blue-400' :
                    prompt.accessLevel === 'PRO' ? 'bg-cyan-500/10 text-cyan-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {prompt.accessLevel}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
