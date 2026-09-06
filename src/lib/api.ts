import { Category, CreatorVideo, CustomPromptRequest, MonthlyUsage, Prompt, SubscriptionPlan, User, VideoReport, AdminStats } from '../types';
import { auth } from './firebase';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const currentUser = auth.currentUser;
  if (currentUser) {
    headers['x-user-id'] = currentUser.uid;
    if (currentUser.email) {
      headers['x-user-email'] = currentUser.email;
    }
    headers['Authorization'] = `Bearer ${currentUser.uid}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetch(`/api/auth/user/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/auth/users', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  },

  // Prompts
  async getPrompts(params: {
    userPlan?: SubscriptionPlan;
    category?: string;
    search?: string;
    accessLevel?: string;
    sort?: string;
  } = {}): Promise<Prompt[]> {
    const query = new URLSearchParams();
    if (params.userPlan) query.set('userPlan', params.userPlan);
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.accessLevel) query.set('accessLevel', params.accessLevel);
    if (params.sort) query.set('sort', params.sort);

    const res = await fetch(`/api/prompts?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load prompts');
    return res.json();
  },

  async getPromptById(id: string, userPlan?: SubscriptionPlan): Promise<Prompt> {
    const query = userPlan ? `?userPlan=${userPlan}` : '';
    const res = await fetch(`/api/prompts/${id}${query}`);
    if (!res.ok) throw new Error('Failed to load prompt');
    return res.json();
  },

  async recordCopy(id: string): Promise<{ success: boolean; copiesCount: number }> {
    const res = await fetch(`/api/prompts/${id}/copy`, { method: 'POST' });
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  },

  // Favorites / My Vault
  async getFavorites(userId: string, userPlan?: SubscriptionPlan): Promise<Prompt[]> {
    const query = userPlan ? `?userPlan=${userPlan}` : '';
    const res = await fetch(`/api/favorites/${userId}${query}`);
    if (!res.ok) throw new Error('Failed to load saved prompts');
    return res.json();
  },

  async toggleFavorite(userId: string, promptId: string): Promise<{ isSaved: boolean; savedIds: string[] }> {
    const res = await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, promptId })
    });
    if (!res.ok) throw new Error('Failed to toggle saved prompt');
    return res.json();
  },

  // Usage
  async getUsage(userId: string): Promise<MonthlyUsage> {
    const res = await fetch(`/api/usage/${userId}`);
    if (!res.ok) throw new Error('Failed to load usage');
    return res.json();
  },

  // AI Prompt Enhancer
  async enhancePrompt(params: {
    userId: string;
    userPlan: SubscriptionPlan;
    idea: string;
    style?: string;
    duration?: string;
    aspectRatio?: string;
    cameraStyle?: string;
    visualQuality?: string;
  }): Promise<{ success: boolean; enhancedPrompt: string; usage: MonthlyUsage; remaining: number | 'unlimited' }> {
    const res = await fetch('/api/ai/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to enhance prompt');
    }
    return data;
  },

  // Image -> Prompt
  async imageToPrompt(params: {
    userId: string;
    userPlan: SubscriptionPlan;
    imageBase64: string;
    mimeType?: string;
  }): Promise<{
    success: boolean;
    masterPrompt: string;
    analysis: {
      subject: string;
      lighting: string;
      environment: string;
      camera: string;
      motionSuggestion: string;
    };
    usage: MonthlyUsage;
    remaining: number | 'unlimited';
  }> {
    const res = await fetch('/api/ai/image-to-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to analyze image');
    }
    return data;
  },

  // Creator Showcase
  async getVideos(category?: string): Promise<CreatorVideo[]> {
    const query = category ? `?category=${category}` : '';
    const res = await fetch(`/api/videos${query}`);
    if (!res.ok) throw new Error('Failed to load videos');
    return res.json();
  },

  async uploadVideo(videoData: Partial<CreatorVideo> & { userPlan: SubscriptionPlan }): Promise<{ success: boolean; video: CreatorVideo; message: string }> {
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload video');
    }
    return data;
  },

  async likeVideo(videoId: string, userId: string): Promise<{ likesCount: number; hasLiked: boolean }> {
    const res = await fetch(`/api/videos/${videoId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  async reportVideo(params: { videoId: string; reporterId: string; reporterName?: string; reason: string; description: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/videos/${params.videoId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  // Custom Requests
  async getCustomRequests(userId: string): Promise<CustomPromptRequest[]> {
    const res = await fetch(`/api/custom-requests/${userId}`);
    if (!res.ok) throw new Error('Failed to load custom requests');
    return res.json();
  },

  async submitCustomRequest(params: Partial<CustomPromptRequest>): Promise<{ success: boolean; request: CustomPromptRequest; usage: MonthlyUsage; message: string }> {
    const res = await fetch('/api/custom-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit custom request');
    }
    return data;
  },

  // Admin
  async getAdminOverview(): Promise<AdminStats> {
    const res = await fetch('/api/admin/overview', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load admin stats: ' + res.statusText);
    return res.json();
  },

  async getAdminPrompts(): Promise<Prompt[]> {
    const res = await fetch('/api/admin/prompts', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load admin prompts: ' + res.statusText);
    return res.json();
  },

  async createPrompt(promptData: Partial<Prompt>): Promise<Prompt> {
    const res = await fetch('/api/admin/prompts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(promptData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create prompt');
    }
    return res.json();
  },

  async updatePrompt(id: string, promptData: Partial<Prompt>): Promise<Prompt> {
    const res = await fetch(`/api/admin/prompts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(promptData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update prompt');
    }
    return res.json();
  },

  async deletePrompt(id: string): Promise<void> {
    const res = await fetch(`/api/admin/prompts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete prompt');
    }
  },

  async getAdminCategories(): Promise<Category[]> {
    const res = await fetch('/api/admin/categories', {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cat)
    });
    return res.json();
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(cat)
    });
    return res.json();
  },

  async deleteCategory(id: string): Promise<void> {
    await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async reorderCategories(orderedIds: string[]): Promise<Category[]> {
    const res = await fetch('/api/admin/categories/reorder', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderedIds })
    });
    return res.json();
  },

  async getAdminVideos(): Promise<CreatorVideo[]> {
    const res = await fetch('/api/admin/videos', {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async setVideoStatus(id: string, status: string, moderationNote?: string): Promise<CreatorVideo> {
    const res = await fetch(`/api/admin/videos/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, moderationNote })
    });
    return res.json();
  },

  async deleteAdminVideo(id: string): Promise<void> {
    await fetch(`/api/admin/videos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async getAdminReports(): Promise<VideoReport[]> {
    const res = await fetch('/api/admin/reports', {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async setReportStatus(id: string, status: string): Promise<VideoReport> {
    const res = await fetch(`/api/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async getAdminCustomRequests(): Promise<CustomPromptRequest[]> {
    const res = await fetch('/api/admin/custom-requests', {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async fulfillCustomRequest(id: string, update: Partial<CustomPromptRequest>): Promise<CustomPromptRequest> {
    const res = await fetch(`/api/admin/custom-requests/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(update)
    });
    return res.json();
  },

  async updateCustomRequest(id: string, update: Partial<CustomPromptRequest>): Promise<CustomPromptRequest> {
    return this.fulfillCustomRequest(id, update);
  },

  // Admin and Super Admin Management
  async getAdmins(): Promise<User[]> {
    const res = await fetch('/api/admin/admins', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load administrators');
    }
    return res.json();
  },

  async promoteUserToAdmin(email: string, name?: string, permissions?: any): Promise<{ success: boolean; message: string; admin: User }> {
    const res = await fetch('/api/admin/admins/promote', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, name, permissions })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to promote user to Admin');
    }
    return res.json();
  },

  async updateAdminPermissions(id: string, permissions: any): Promise<{ success: boolean; admin: User }> {
    const res = await fetch(`/api/admin/admins/${id}/permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissions })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update admin permissions');
    }
    return res.json();
  },

  async removeAdmin(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/admin/admins/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to remove admin');
    }
    return res.json();
  },

  // Subscriptions
  async requestSubscription(userId: string, plan: SubscriptionPlan): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch('/api/subscriptions/request', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, plan })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit subscription request');
    }
    return res.json();
  },

  async approveSubscription(userId: string, plan: SubscriptionPlan): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/admin/subscriptions/approve', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, plan })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve subscription');
    }
    return res.json();
  },

  async getPendingSubscriptions(): Promise<{ userId: string; userEmail: string; userName: string; requestedPlan: SubscriptionPlan; requestedAt: string }[]> {
    const res = await fetch('/api/admin/subscriptions/pending', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to load pending subscriptions');
    }
    return res.json();
  }
};
