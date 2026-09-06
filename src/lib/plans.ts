import { PlanConfig, PromptAccessLevel, SubscriptionPlan } from '../types';

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  FREE: {
    name: 'FREE',
    displayName: 'Free Tier',
    priceMonthly: 0,
    description: 'Essential access for beginners exploring AI video creation.',
    promptAccess: 'selectedFree',
    promptCopies: 'unlimited',
    savedPrompts: 'unlimited',
    promptEnhancer: 50,
    imageToPrompt: 25,
    creatorUploads: 0,
    customRequests: 0,
    highlights: [
      'Access to selected Free Master Prompts',
      'Unlimited prompt copying',
      'Unlimited saved prompts in My Vault',
      '50 AI Prompt Enhancements / month',
      '25 Image → Prompt generations / month',
      'Standard community support'
    ]
  },
  PLUS: {
    name: 'PLUS',
    displayName: 'Creator Plus',
    priceMonthly: 5,
    description: 'Perfect for active social media creators & short-form video producers.',
    promptAccess: 'selectedPlus',
    promptCopies: 'unlimited',
    savedPrompts: 'unlimited',
    promptEnhancer: 200,
    imageToPrompt: 500,
    creatorUploads: 'unlimited',
    customRequests: 0,
    badge: 'Best for Creators',
    highlights: [
      'Access to Free + Plus Master Prompts',
      'Unlimited prompt copies & vault saves',
      '200 AI Prompt Enhancements / month',
      '500 Image → Prompt generations / month',
      'Unlimited Creator Showcase uploads',
      'Direct creator video portfolio page'
    ]
  },
  PRO: {
    name: 'PRO',
    displayName: 'Pro Master',
    priceMonthly: 10,
    description: 'High-volume production suite for YouTubers, agencies & AI filmmakers.',
    promptAccess: 'unlimited',
    promptCopies: 'unlimited',
    savedPrompts: 'unlimited',
    promptEnhancer: 500,
    imageToPrompt: 5000,
    creatorUploads: 'unlimited',
    customRequests: 25,
    badge: 'Most Popular',
    highlights: [
      'Full, unrestricted Master Prompt library',
      'Unlimited prompt copies & vault saves',
      '500 AI Prompt Enhancements / month',
      '5,000 Image → Prompt generations / month',
      'Unlimited Creator Showcase uploads',
      '25 Custom Master Prompt requests / month'
    ]
  },
  STUDIO: {
    name: 'STUDIO',
    displayName: 'Studio Ultimate',
    priceMonthly: 20,
    description: 'Unlimited creative powerhouse for production houses & commercial studios.',
    promptAccess: 'unlimited',
    promptCopies: 'unlimited',
    savedPrompts: 'unlimited',
    promptEnhancer: 'unlimited',
    imageToPrompt: 'unlimited',
    creatorUploads: 'unlimited',
    customRequests: 'unlimited',
    priorityRequests: true,
    badge: 'Professional',
    highlights: [
      'Unrestricted Master Prompt library',
      'Unlimited AI Prompt Enhancer',
      'Unlimited Image → Prompt analysis',
      'Unlimited Creator Showcase uploads',
      'Unlimited Custom Master Prompt requests',
      'Priority VIP custom prompt turnaround'
    ]
  }
};

/**
 * Validates whether a user's subscription tier has access to view and copy a prompt.
 */
export function canUserAccessPrompt(userPlan: SubscriptionPlan, promptAccessLevel: PromptAccessLevel): boolean {
  if (promptAccessLevel === 'FREE' || promptAccessLevel === 'ALL') {
    return true;
  }

  if (userPlan === 'STUDIO') {
    return true;
  }

  if (userPlan === 'PRO') {
    return promptAccessLevel === 'PRO' || promptAccessLevel === 'PLUS';
  }

  if (userPlan === 'PLUS') {
    return promptAccessLevel === 'PLUS';
  }

  // userPlan === 'FREE'
  return false;
}

/**
 * Returns minimum plan needed to access a given prompt level
 */
export function getRequiredPlanForLevel(level: PromptAccessLevel): SubscriptionPlan {
  switch (level) {
    case 'STUDIO':
      return 'STUDIO';
    case 'PRO':
      return 'PRO';
    case 'PLUS':
      return 'PLUS';
    case 'FREE':
    case 'ALL':
    default:
      return 'FREE';
  }
}

/**
 * Checks if user has remaining usage for an AI tool
 */
export function hasRemainingUsage(
  userPlan: SubscriptionPlan,
  feature: 'promptEnhancer' | 'imageToPrompt' | 'customRequests',
  used: number
): { allowed: boolean; limit: number | 'unlimited'; remaining: number | 'unlimited' } {
  const plan = SUBSCRIPTION_PLANS[userPlan];
  const limit = plan[feature];

  if (limit === 'unlimited') {
    return { allowed: true, limit: 'unlimited', remaining: 'unlimited' };
  }

  const numericLimit = typeof limit === 'number' ? limit : 0;
  const remaining = Math.max(0, numericLimit - used);

  return {
    allowed: remaining > 0,
    limit: numericLimit,
    remaining
  };
}
