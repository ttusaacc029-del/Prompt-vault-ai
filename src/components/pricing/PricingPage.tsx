import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { SUBSCRIPTION_PLANS } from '../../lib/plans';
import { SubscriptionPlan } from '../../types';
import { 
  Check, X, Sparkles, Zap, Shield, Crown, HelpCircle, 
  ChevronDown, ChevronUp, CheckCircle2, ArrowRight
} from 'lucide-react';

interface PricingPageProps {
  onPlanSelected?: (plan: SubscriptionPlan) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onPlanSelected }) => {
  const { user, isGuest, upgradePlan, showToast } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const userCurrentPlan = user?.plan || 'FREE';

  const handleSelectPlan = async (planKey: SubscriptionPlan) => {
    if (isGuest) {
      showToast('Please create a free account first to request or upgrade your subscription.');
      return;
    }
    if (planKey === userCurrentPlan) {
      showToast(`You are currently on the ${planKey} plan.`);
      return;
    }
    if (user?.subscriptionRequested === planKey) {
      showToast(`Your request for the ${planKey} plan is already pending Administrator approval.`);
      return;
    }
    await upgradePlan(planKey);
    if (onPlanSelected) onPlanSelected(planKey);
  };

  const featureMatrix = [
    { feature: 'Master Prompts Library Access', free: 'Selected Free Prompts', plus: 'Selected Plus Prompts', pro: 'Unlimited Full Access', studio: 'Unlimited Full Access' },
    { feature: 'Prompt Copies & Vault Saves', free: 'Unlimited', plus: 'Unlimited', pro: 'Unlimited', studio: 'Unlimited' },
    { feature: 'AI Prompt Enhancer (Gemini 3.8)', free: '50 / month', plus: '200 / month', pro: '500 / month', studio: 'Unlimited' },
    { feature: 'Image → Video Prompt Analysis', free: '25 / month', plus: '500 / month', pro: '5,000 / month', studio: 'Unlimited' },
    { feature: 'Creator Showcase Uploads', free: '0 (View Only)', plus: 'Unlimited', pro: 'Unlimited', studio: 'Unlimited' },
    { feature: 'Custom Master Prompt Requests', free: '0', plus: '0', pro: '25 / month', studio: 'Unlimited (Priority)' },
    { feature: 'Early Access New Drops', free: false, plus: false, pro: true, studio: true },
    { feature: 'VIP Priority Turnaround', free: false, plus: false, pro: false, studio: true },
  ];

  const faqs = [
    {
      q: 'Which video generation platforms are supported?',
      a: 'All Master Prompts in Prompt Vault are optimized with camera dynamics, lens specs, and lighting cues designed for Runway Gen-3 Alpha, Kling 1.5 Pro, Luma Dream Machine, OpenAI Sora, Minimax Hailuo, and Pika 2.0.'
    },
    {
      q: 'Can I cancel or switch my plan at any time?',
      a: 'Yes! You can upgrade, downgrade, or cancel whenever you choose. Upgrades take effect immediately with full access to higher tier libraries.'
    },
    {
      q: 'What are Custom Master Prompt Requests?',
      a: 'Custom Requests allow Pro and Studio members to request specialized prompt recipes crafted by our senior prompt directors for your specific commercial or film project.'
    },
    {
      q: 'Can I use prompts for commercial film and client projects?',
      a: 'Absolutely. Prompts generated or copied from Prompt Vault can be used for both personal and commercial video generation without additional royalty fees.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold tracking-wide border border-cyan-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Flexible Creator Pricing</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-display">
          Unlock the Full Creative Vault
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          From independent filmmakers to high-volume commercial studios, select the subscription tier tailored to your workflow.
        </p>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-xs font-semibold ${billingCycle === 'monthly' ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-500'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-800 p-1 relative transition-colors focus:outline-none"
          >
            <div
              className={`w-4 h-4 rounded-full bg-cyan-500 transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-semibold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-500'}`}>
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['FREE', 'PLUS', 'PRO', 'STUDIO'] as const).map(planKey => {
          const plan = SUBSCRIPTION_PLANS[planKey];
          const isCurrent = userCurrentPlan === planKey;
          const isPro = planKey === 'PRO';
          const isStudio = planKey === 'STUDIO';

          const monthlyPrice = billingCycle === 'yearly' && plan.priceMonthly > 0
            ? Math.round(plan.priceMonthly * 0.8)
            : plan.priceMonthly;

          return (
            <div
              key={planKey}
              className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative transition-all ${
                isPro
                  ? 'border-2 border-cyan-500 bg-cyan-950/20 shadow-2xl shadow-cyan-500/15'
                  : isStudio
                  ? 'border-2 border-amber-500/80 bg-amber-950/20 shadow-xl'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B101D]'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between min-h-[28px] mb-4">
                {plan.badge ? (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                    isPro ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                    isStudio ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {plan.badge}
                  </span>
                ) : <span />}

                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    Current Plan
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                    {plan.displayName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-display">
                    ${monthlyPrice}
                  </span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                {billingCycle === 'yearly' && plan.priceMonthly > 0 && (
                  <p className="text-[11px] text-emerald-500 dark:text-emerald-400">
                    Billed annually (${monthlyPrice * 12}/yr)
                  </p>
                )}

                {/* Highlights list */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    What's Included:
                  </span>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                    {plan.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          isPro ? 'text-cyan-400' : isStudio ? 'text-amber-400' : 'text-slate-400'
                        }`} />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action button */}
              <div className="pt-8">
                {user?.subscriptionRequested === planKey ? (
                  <div className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center gap-1.5 cursor-default">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Request Pending Admin Review</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(planKey)}
                    disabled={isCurrent}
                    className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                        : isPro
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25'
                        : isStudio
                        ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-500/20'
                        : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90'
                    }`}
                  >
                    {isCurrent ? (
                      <span>Your Active Plan</span>
                    ) : (
                      <>
                        <span>{plan.priceMonthly === 0 ? 'Switch to Free' : `Request ${plan.displayName} Plan`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
            Plan Feature Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare all quotas, privileges, and tool allocations side-by-side.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090F1C]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <th className="p-4 font-bold text-slate-800 dark:text-slate-200">Capabilities</th>
                <th className="p-4 font-bold text-center text-slate-600 dark:text-slate-400">Free</th>
                <th className="p-4 font-bold text-center text-blue-500">Plus ($5)</th>
                <th className="p-4 font-bold text-center text-cyan-500">Pro ($10)</th>
                <th className="p-4 font-bold text-center text-amber-500">Studio ($20)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
              {featureMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="p-4 font-medium text-slate-900 dark:text-white">{row.feature}</td>
                  <td className="p-4 text-center">
                    {typeof row.free === 'boolean' ? (
                      row.free ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-400 mx-auto" />
                    ) : row.free}
                  </td>
                  <td className="p-4 text-center">
                    {typeof row.plus === 'boolean' ? (
                      row.plus ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-400 mx-auto" />
                    ) : row.plus}
                  </td>
                  <td className="p-4 text-center font-medium text-cyan-400">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? <Check className="w-4 h-4 text-cyan-400 mx-auto" /> : <X className="w-4 h-4 text-slate-400 mx-auto" />
                    ) : row.pro}
                  </td>
                  <td className="p-4 text-center font-medium text-amber-400">
                    {typeof row.studio === 'boolean' ? (
                      row.studio ? <Check className="w-4 h-4 text-amber-400 mx-auto" /> : <X className="w-4 h-4 text-slate-400 mx-auto" />
                    ) : row.studio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-3xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Everything you need to know about Prompt Vault subscriptions.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:text-cyan-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
