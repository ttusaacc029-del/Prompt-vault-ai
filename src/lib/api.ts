import { Category, CreatorVideo, CustomPromptRequest, Prompt, SubscriptionPlan, User, VideoReport, MonthlyUsage, AdminStats } from '../types';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || '';
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Safely executes a fetch request and parses JSON response,
 * reading the raw text first to guarantee that HTML/404/500 responses
 * never crash with 'Unexpected token' syntax errors.
 */
export async function safeFetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers
    });
  } catch (netErr: any) {
    throw new Error(`Network error: ${netErr.message || 'Failed to connect to server.'}`);
  }

  const rawText = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = null;
  }

  if (!res.ok) {
    let errorMsg = data?.error || data?.message;
    if (!errorMsg) {
      if (res.status === 404) {
        errorMsg = `API endpoint ${url} was not found (404).`;
      } else if (rawText.trim().startsWith('<') || rawText.trim().toLowerCase().includes('the page could not be found')) {
        errorMsg = `Server error (${res.status}): Expected JSON but received an HTML response.`;
      } else if (rawText.trim().length > 0 && rawText.trim().length < 200) {
        errorMsg = rawText.trim();
      } else {
        errorMsg = `Server error (${res.status}): Please try again.`;
      }
    }
    throw new Error(errorMsg);
  }

  if (data === null || data === undefined) {
    if (rawText.trim().length === 0) {
      return {} as T;
    }
    throw new Error('Server returned an invalid non-JSON response format.');
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string): Promise<{ user: User }> {
    return safeFetchJson<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return safeFetchJson<User>(`/api/auth/user/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
  },

  async getUsers(): Promise<User[]> {
    return safeFetchJson<User[]>('/api/auth/users', {
      headers: getAuthHeaders()
    });
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

    return safeFetchJson<Prompt[]>(`/api/prompts?${query.toString()}`);
  },

  async getPromptById(id: string, userPlan?: SubscriptionPlan): Promise<Prompt> {
    const query = userPlan ? `?userPlan=${userPlan}` : '';
    return safeFetchJson<Prompt>(`/api/prompts/${id}${query}`);
  },

  async recordCopy(id: string): Promise<{ success: boolean; copiesCount: number }> {
    return safeFetchJson<{ success: boolean; copiesCount: number }>(`/api/prompts/${id}/copy`, {
      method: 'POST'
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return safeFetchJson<Category[]>('/api/categories');
  },

  // Favorites / My Vault
  async getFavorites(userId: string, userPlan?: SubscriptionPlan): Promise<Prompt[]> {
    const query = userPlan ? `?userPlan=${userPlan}` : '';
    return safeFetchJson<Prompt[]>(`/api/favorites/${userId}${query}`);
  },

  async toggleFavorite(userId: string, promptId: string): Promise<{ isSaved: boolean; savedIds: string[] }> {
    return safeFetchJson<{ isSaved: boolean; savedIds: string[] }>('/api/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ userId, promptId })
    });
  },

  // Usage
  async getUsage(userId: string): Promise<MonthlyUsage> {
    return safeFetchJson<MonthlyUsage>(`/api/usage/${userId}`);
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
    return safeFetchJson<{ success: boolean; enhancedPrompt: string; usage: MonthlyUsage; remaining: number | 'unlimited' }>(
      '/api/ai/enhance-prompt',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params)
      }
    );
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
    return safeFetchJson('/api/ai/image-to-prompt', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
  },

  // Creator Showcase
  async getVideos(category?: string): Promise<CreatorVideo[]> {
    const query = category ? `?category=${category}` : '';
    return safeFetchJson<CreatorVideo[]>(`/api/videos${query}`);
  },

  async uploadVideo(videoData: Partial<CreatorVideo> & { userPlan: SubscriptionPlan }): Promise<{ success: boolean; video: CreatorVideo; message: string }> {
    return safeFetchJson<{ success: boolean; video: CreatorVideo; message: string }>('/api/videos', {
      method: 'POST',
      body: JSON.stringify(videoData)
    });
  },

  async likeVideo(videoId: string, userId: string): Promise<{ likesCount: number; hasLiked: boolean }> {
    return safeFetchJson<{ likesCount: number; hasLiked: boolean }>(`/api/videos/${videoId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  async reportVideo(params: { videoId: string; reporterId: string; reporterName?: string; reason: string; description: string }): Promise<{ success: boolean; message: string }> {
    return safeFetchJson<{ success: boolean; message: string }>(`/api/videos/${params.videoId}/report`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // Custom Requests
  async getCustomRequests(userId: string): Promise<CustomPromptRequest[]> {
    return safeFetchJson<CustomPromptRequest[]>(`/api/custom-requests/${userId}`);
  },

  async submitCustomRequest(params: Partial<CustomPromptRequest>): Promise<{ success: boolean; request: CustomPromptRequest; usage: MonthlyUsage; message: string }> {
    return safeFetchJson<{ success: boolean; request: CustomPromptRequest; usage: MonthlyUsage; message: string }>('/api/custom-requests', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  // Admin
  async getAdminOverview(): Promise<AdminStats> {
    return safeFetchJson<AdminStats>('/api/admin/overview', {
      headers: getAuthHeaders()
    });
  },

  async getAdminPrompts(): Promise<Prompt[]> {
    return safeFetchJson<Prompt[]>('/api/admin/prompts', {
      headers: getAuthHeaders()
    });
  },

  async createPrompt(promptData: Partial<Prompt>): Promise<Prompt> {
    return safeFetchJson<Prompt>('/api/admin/prompts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(promptData)
    });
  },

  async updatePrompt(id: string, promptData: Partial<Prompt>): Promise<Prompt> {
    return safeFetchJson<Prompt>(`/api/admin/prompts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(promptData)
    });
  },

  async deletePrompt(id: string): Promise<void> {
    return safeFetchJson<void>(`/api/admin/prompts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async getAdminCategories(): Promise<Category[]> {
    return safeFetchJson<Category[]>('/api/admin/categories', {
      headers: getAuthHeaders()
    });
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    return safeFetchJson<Category>('/api/admin/categories', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cat)
    });
  },

  async updateCategory(id: string, cat: Partial<Category>): Promise<Category> {
    return safeFetchJson<Category>(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(cat)
    });
  },

  async deleteCategory(id: string): Promise<void> {
    return safeFetchJson<void>(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async reorderCategories(orderedIds: string[]): Promise<Category[]> {
    return safeFetchJson<Category[]>('/api/admin/categories/reorder', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderedIds })
    });
  },

  async getAdminVideos(): Promise<CreatorVideo[]> {
    return safeFetchJson<CreatorVideo[]>('/api/admin/videos', {
      headers: getAuthHeaders()
    });
  },

  async setVideoStatus(id: string, status: string, moderationNote?: string): Promise<CreatorVideo> {
    return safeFetchJson<CreatorVideo>(`/api/admin/videos/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, moderationNote })
    });
  },

  async deleteAdminVideo(id: string): Promise<void> {
    return safeFetchJson<void>(`/api/admin/videos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  async getAdminReports(): Promise<VideoReport[]> {
    return safeFetchJson<VideoReport[]>('/api/admin/reports', {
      headers: getAuthHeaders()
    });
  },

  async setReportStatus(id: string, status: string): Promise<VideoReport> {
    return safeFetchJson<VideoReport>(`/api/admin/reports/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
  },

  async getAdminCustomRequests(): Promise<CustomPromptRequest[]> {
    return safeFetchJson<CustomPromptRequest[]>('/api/admin/custom-requests', {
      headers: getAuthHeaders()
    });
  },

  async fulfillCustomRequest(id: string, update: Partial<CustomPromptRequest>): Promise<CustomPromptRequest> {
    return safeFetchJson<CustomPromptRequest>(`/api/admin/custom-requests/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(update)
    });
  },

  async updateCustomRequest(id: string, update: Partial<CustomPromptRequest>): Promise<CustomPromptRequest> {
    return this.fulfillCustomRequest(id, update);
  },

  // Admin and Super Admin Management
  async getAdmins(): Promise<User[]> {
    return safeFetchJson<User[]>('/api/admin/admins', {
      headers: getAuthHeaders()
    });
  },

  async promoteUserToAdmin(email: string, name?: string, permissions?: any): Promise<{ success: boolean; message: string; admin: User }> {
    return safeFetchJson<{ success: boolean; message: string; admin: User }>('/api/admin/admins/promote', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, name, permissions })
    });
  },

  async updateAdminPermissions(id: string, permissions: any): Promise<{ success: boolean; admin: User }> {
    return safeFetchJson<{ success: boolean; admin: User }>(`/api/admin/admins/${id}/permissions`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ permissions })
    });
  },

  async removeAdmin(id: string): Promise<{ success: boolean; message: string }> {
    return safeFetchJson<{ success: boolean; message: string }>(`/api/admin/admins/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // Subscriptions
  async requestSubscription(userId: string, plan: SubscriptionPlan): Promise<{ success: boolean; message: string; user: User }> {
    return safeFetchJson<{ success: boolean; message: string; user: User }>('/api/subscriptions/request', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, plan })
    });
  },

  async approveSubscription(userId: string, plan: SubscriptionPlan): Promise<{ success: boolean; user: User }> {
    return safeFetchJson<{ success: boolean; user: User }>('/api/admin/subscriptions/approve', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, plan })
    });
  },

  async getPendingSubscriptions(): Promise<{ userId: string; userEmail: string; userName: string; requestedPlan: SubscriptionPlan; requestedAt: string }[]> {
    return safeFetchJson<{ userId: string; userEmail: string; userName: string; requestedPlan: SubscriptionPlan; requestedAt: string }[]>('/api/admin/subscriptions/pending', {
      headers: getAuthHeaders()
    });
  }
};
