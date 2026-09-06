export type SubscriptionPlan = 'FREE' | 'PLUS' | 'PRO' | 'STUDIO';

export type UserRole = 'user' | 'admin' | 'superadmin';

export type PromptAccessLevel = 'FREE' | 'PLUS' | 'PRO' | 'STUDIO' | 'ALL';

export type VideoModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'FULFILLED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED' | 'REJECTED';

export interface AdminPermissions {
  canManagePrompts: boolean;
  canManageCategories: boolean;
  canManageUsers: boolean;
  canManageSubscriptions: boolean;
  canManageVideos: boolean;
  canManageRequests: boolean;
  canManageReports: boolean;
  canManageAdmins?: boolean;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  isSuperAdmin?: boolean;
  adminPermissions?: AdminPermissions;
  plan: SubscriptionPlan;
  subscriptionStatus: 'active' | 'trialing' | 'canceled' | 'past_due';
  createdAt: string;
  updatedAt: string;
}

export interface PlanConfig {
  name: SubscriptionPlan;
  displayName: string;
  priceMonthly: number;
  description: string;
  promptAccess: 'selectedFree' | 'selectedPlus' | 'unlimited';
  promptCopies: 'unlimited';
  savedPrompts: 'unlimited';
  promptEnhancer: number | 'unlimited';
  imageToPrompt: number | 'unlimited';
  creatorUploads: number | 'unlimited';
  customRequests: number | 'unlimited';
  priorityRequests?: boolean;
  badge?: string;
  highlights: string[];
}

export interface MonthlyUsage {
  userId: string;
  month: string; // 'YYYY-MM'
  promptEnhancerUsed: number;
  imageToPromptUsed: number;
  customRequestsUsed: number;
  updatedAt: string;
}

export interface PromptVariable {
  key: string;
  label: string;
  defaultValue: string;
  description?: string;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string;
  previewMedia?: string;
  fullPrompt: string;
  exampleOutput: string;
  recommendedUse: string;
  creationDate: string;
  updatedDate: string;
  featuredStatus: boolean;
  accessLevel: PromptAccessLevel;
  customizableVariables: PromptVariable[];
  copiesCount: number;
  savesCount: number;
  isPublished: boolean;
  authorName?: string;
  isLockedForUser?: boolean;
  requiredPlan?: SubscriptionPlan;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  isEnabled: boolean;
}

export interface CreatorVideo {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  title: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  promptUsed: string;
  promptId?: string;
  aiGeneratorModel?: string;
  likesCount: number;
  viewsCount: number;
  uploadDate: string;
  status: VideoModerationStatus;
  moderationNote?: string;
  likedBy?: string[];
}

export interface VideoReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  videoId: string;
  videoTitle?: string;
  reason: string;
  description: string;
  createdAt: string;
  status: ReportStatus;
}

export interface CustomPromptRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPlan: SubscriptionPlan;
  title: string;
  idea?: string;
  description?: string;
  detailedDescription?: string;
  style?: string;
  targetPlatform?: string;
  targetEngine?: string;
  aspectRatio?: string;
  desiredDuration?: string;
  referenceImageUrl?: string;
  additionalRequirements?: string;
  status: RequestStatus;
  priority?: boolean;
  adminNotes?: string;
  finalMasterPrompt?: string;
  fulfilledPrompt?: string;
  fulfilledDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions?: number;
  activeSubscribers: number;
  planCounts?: {
    FREE: number;
    PLUS: number;
    PRO: number;
    STUDIO: number;
  };
  totalPrompts: number;
  categoriesCount: number;
  totalCopies: number;
  revenueEstimate: number;
  popularCategories: string[];
  totalVideos?: number;
  pendingModeration?: number;
  pendingCustomRequests?: number;
  aiUsageTotal?: {
    promptEnhancer: number;
    imageToPrompt: number;
    customRequests: number;
  };
}
