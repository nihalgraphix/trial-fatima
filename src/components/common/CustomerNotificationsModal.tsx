import React, { useState } from 'react';
import {
  X,
  Bell,
  MessageSquare,
  CheckCircle2,
  Clock,
  CornerDownLeft,
  Sparkles,
  ShoppingBag,
  Trash2,
  ExternalLink,
  Truck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface CustomerNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveChat?: () => void;
}

export const CustomerNotificationsModal: React.FC<CustomerNotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenLiveChat,
}) => {
  const {
    customerMessages,
    supportThreads,
    currentUser,
    isAdmin,
    notifications,
    customerNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    deleteCustomerMessage,
    navigateToOrder,
  } = useStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'orders' | 'support'>('all');

  if (!isOpen) return null;

  // Filter messages for current user or session
  const userEmail = currentUser?.email?.toLowerCase().trim();
  const myMessages = (customerMessages || []).filter((m) => {
    if (userEmail) {
      return m.email?.toLowerCase().trim() === userEmail;
    }
    return true;
  });

  const repliedMessages = myMessages.filter((m) => m.replyNotes || m.status === 'replied');

  // Support thread replies for current user
  const mySupportThreads = (supportThreads || []).filter((t) => {
    if (currentUser?.id && t.customerId === currentUser.id) return true;
    if (userEmail && t.customerEmail?.toLowerCase().trim() === userEmail) return true;
    return false;
  });

  // Combine customerNotifications with fallback to notifications if guest/admin
  const baseNotifications =
    isAdmin
      ? notifications || []
      : (customerNotifications || []).length > 0
      ? customerNotifications
      : (notifications || []).filter((n) => !n.userId || n.userId === 'guest' || n.target === 'all');

  const filteredNotifications = baseNotifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'orders') return n.type === 'order';
    if (activeFilter === 'support') return n.type === 'customer';
    return true;
  });

  const myNotifications = filteredNotifications.slice(0, 30);
  const unreadCount = baseNotifications.filter((n) => !n.read).length;

  const handleClearAllNotifications = () => {
    clearNotifications();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[85vh] text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 bg-[#FAF7F2] border-b border-[#E8E8E3] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center font-bold shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-[#171717] tracking-tight truncate">
                Notifications & Live Order Alerts
              </h3>
              <p className="text-[11px] text-[#6B6B6B] truncate">
                Real-time updates from Fathima Stores Admin & Delivery Team
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="px-2.5 py-1.5 rounded-lg bg-[#EFF4E6] text-[#71883F] hover:bg-[#71883F] hover:text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Mark read</span>
              </button>
            )}
            {baseNotifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllNotifications}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                title="Clear all notifications"
              >
                <Trash2 className="w-3 h-3 shrink-0" />
                <span>Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#6B6B6B] hover:text-[#171717] hover:bg-[#E8E8E3]/50 rounded-lg cursor-pointer transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-2.5 bg-white border-b border-[#E8E8E3] flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All (${baseNotifications.length})` },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'orders', label: 'Orders & Delivery' },
                { id: 'support', label: 'Admin & Support' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-[#71883F] text-white shadow-2xs'
                    : 'bg-[#F7F8F3] text-[#6B6B6B] hover:text-[#171717]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Section: Order & System Updates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider">
                Order & Store Updates ({myNotifications.length})
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                  {unreadCount} Unread
                </span>
              )}
            </div>

            {myNotifications.length === 0 ? (
              <div className="p-8 text-center text-[#6B6B6B] bg-[#F7F8F3] rounded-xl border border-dashed border-[#E8E8E3] space-y-1.5 text-xs">
                <Sparkles className="w-6 h-6 text-neutral-400 mx-auto" />
                <p className="font-bold text-[#171717]">All Clear!</p>
                <p className="text-[11px]">No notifications matching this filter right now.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markNotificationAsRead(notif.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      notif.read
                        ? 'bg-white border-[#E8E8E3] opacity-85'
                        : 'bg-[#EFF4E6]/50 border-[#71883F]/30 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 p-2 rounded-lg shrink-0 flex items-center justify-center ${
                          notif.type === 'order'
                            ? 'bg-sky-50 text-sky-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {notif.type === 'order' ? (
                          <ShoppingBag className="w-3.5 h-3.5" />
                        ) : (
                          <Bell className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs font-bold leading-snug ${
                              notif.read ? 'text-[#171717]' : 'text-[#71883F]'
                            }`}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#71883F] shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] mt-1 leading-relaxed break-words">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-[#E8E8E3]/60">
                          <p className="text-[10px] text-[#A3A3A3] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              {new Date(notif.time).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            {notif.orderId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!notif.read) markNotificationAsRead(notif.id);
                                  onClose();
                                  navigateToOrder(notif.orderId!);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#71883F] hover:underline cursor-pointer"
                              >
                                <Truck className="w-3 h-3" />
                                Track Order
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {!notif.read && (
                              <span className="text-[10px] font-bold text-[#71883F]">
                                Mark read
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Direct Support & Admin Replies */}
          <div className="pt-4 border-t border-[#E8E8E3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#71883F] uppercase tracking-wider block">
                Direct Support & Inquiry Replies ({repliedMessages.length + mySupportThreads.length})
              </span>
            </div>

            {repliedMessages.length === 0 && mySupportThreads.length === 0 ? (
              <div className="p-4 text-center text-[#6B6B6B] bg-[#FAF7F2] rounded-xl border border-[#E8E8E3] space-y-1 text-xs opacity-75">
                <p className="font-medium">No active support replies yet</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {repliedMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#171717] truncate">
                        Inquiry: {msg.subject || 'Customer Message'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono">
                          Replied
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteCustomerMessage(msg.id)}
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Dismiss reply"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {msg.replyNotes && (
                      <div className="p-3 bg-white border border-[#71883F]/20 rounded-lg text-xs space-y-1 text-[#171717]">
                        <div className="flex items-center gap-1.5 font-bold text-[#71883F] text-[11px]">
                          <CornerDownLeft className="w-3.5 h-3.5 shrink-0" /> Staff Response:
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed font-medium">
                          {msg.replyNotes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {mySupportThreads.map((thread) => {
                  const lastMsg = thread.messages[thread.messages.length - 1];
                  return (
                    <div
                      key={thread.id}
                      className="p-3.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#171717] truncate">
                          Ticket: {thread.subject}
                        </span>
                        <span className="text-[10px] bg-[#EFF4E6] text-[#71883F] font-bold px-2 py-0.5 rounded uppercase">
                          {thread.status.replace('_', ' ')}
                        </span>
                      </div>
                      {lastMsg && (
                        <div className="p-2.5 bg-white border border-[#E8E8E3] rounded-lg text-xs">
                          <span className="font-bold text-[#71883F]">{lastMsg.senderName}: </span>
                          <span className="text-[#171717]">{lastMsg.message}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#FAF7F2] border-t border-[#E8E8E3] flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#6B6B6B]">Need help with an order?</p>

          <div className="flex items-center gap-2">
            {baseNotifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllNotifications}
                className="px-3 py-1.5 border border-[#E8E8E3] bg-white hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenLiveChat) onOpenLiveChat();
              }}
              className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Live Support Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
