import React from 'react';
import { SubscriptionPlan } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../lib/plans';
import { Sparkles, Crown, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPlan: SubscriptionPlan;
  featureName: string;
  reason?: string;
  onUpgrade: (targetPlan: SubscriptionPlan) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  requiredPlan,
  featureName,
  reason,
  onUpgrade
}) => {
  if (!isOpen) return null;

  const plan = SUBSCRIPTION_PLANS[requiredPlan] || SUBSCRIPTION_PLANS.PRO;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0B1120] border-2 border-cyan-500/60 dark:border-cyan-500/40 shadow-2xl shadow-cyan-500/10 p-6 sm:p-7 space-y-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
            <Crown className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block font-display">
            Plan Upgrade Required
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
            Unlock {featureName}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            {reason || `This feature requires the ${plan.displayName} or higher tier.`}
          </p>
        </div>

        {/* Plan card summary */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-sm font-display">
              {plan.displayName}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-cyan-400 font-display">
                ${plan.priceMonthly}
              </span>
              <span className="text-slate-400 text-xs">/mo</span>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            {plan.highlights.slice(0, 3).map((h, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onUpgrade(requiredPlan);
              onClose();
            }}
            className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <span>Upgrade to {plan.displayName} (${plan.priceMonthly}/mo)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-center"
          >
            Maybe later
          </button>
        </div>

      </div>
    </div>
  );
};
