/**
 * Notification Service
 * Section 51: Real-time Creator Notifications
 */

export interface AppNotification {
  id: string;
  userId: string;
  type: 'REQUEST_UPDATE' | 'VIDEO_APPROVED' | 'VIDEO_REJECTED' | 'SUBSCRIPTION_CHANGE' | 'AI_COMPLETED' | 'ADMIN_MESSAGE';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  linkTab?: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  private listeners: Array<(notifications: AppNotification[]) => void> = [];
  private memoryNotifications: AppNotification[] = [];

  constructor() {
    // Initial mock system notifications
    this.memoryNotifications = [
      {
        id: 'notif-1',
        userId: 'any',
        type: 'ADMIN_MESSAGE',
        title: 'Welcome to Prompt Vault!',
        message: 'Explore over 300+ hand-curated Master Prompts for Runway Gen-3, Kling 1.5, and Sora.',
        createdAt: 'Just now',
        read: false,
        linkTab: 'prompts'
      },
      {
        id: 'notif-2',
        userId: 'any',
        type: 'AI_COMPLETED',
        title: 'AI Enhancer Powered by Gemini 3.8',
        message: 'Your monthly quota is ready. Try converting a basic idea into an anamorphic film scene.',
        createdAt: '1 hour ago',
        read: false,
        linkTab: 'ai-tools'
      }
    ];
  }

  getNotifications(userId: string): AppNotification[] {
    return this.memoryNotifications;
  }

  markAsRead(id: string): void {
    const notif = this.memoryNotifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.notifyListeners();
    }
  }

  markAllAsRead(): void {
    this.memoryNotifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  pushNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: 'Just now',
      read: false
    };
    this.memoryNotifications.unshift(newNotif);
    this.notifyListeners();
    return newNotif;
  }

  subscribe(listener: (notifications: AppNotification[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.memoryNotifications);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l([...this.memoryNotifications]));
  }
}

export const notificationService = new NotificationService();
