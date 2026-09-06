import React, { useState, useEffect } from 'react';
import { notificationService, AppNotification } from '../../services/notificationService';
import { useAuth } from '../../lib/authContext';
import { 
  Bell, CheckCircle2, AlertCircle, Sparkles, Video, 
  CreditCard, MessageSquare, Check, X, ExternalLink
} from 'lucide-react';

interface NotificationDropdownProps {
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((list) => {
      setNotifications([...list]);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleItemClick = (notif: AppNotification) => {
    notificationService.markAsRead(notif.id);
    if (notif.linkTab && onNavigateTab) {
      onNavigateTab(notif.linkTab);
      setIsOpen(false);
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'REQUEST_UPDATE':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'VIDEO_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'VIDEO_REJECTED':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'SUBSCRIPTION_CHANGE':
        return <CreditCard className="w-4 h-4 text-cyan-400" />;
      case 'AI_COMPLETED':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'ADMIN_MESSAGE':
      default:
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-black text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-[#080D1A]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white font-display">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-cyan-500 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      !n.read 
                        ? 'bg-cyan-500/[0.03] dark:bg-cyan-500/[0.05] hover:bg-cyan-500/[0.08]' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getIcon(n.type)}
                    </div>
                    <div className="space-y-1 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-semibold truncate ${!n.read ? 'text-cyan-400 font-bold' : 'text-slate-900 dark:text-white'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 shrink-0">{n.createdAt}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
