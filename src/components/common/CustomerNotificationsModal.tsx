import React from 'react';
import { X, Bell, MessageSquare, CheckCircle2, Clock, CornerDownLeft, Sparkles, ArrowRight, ShoppingBag } from 'lucide-react';
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
  const { customerMessages, currentUser, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useStore();

  if (!isOpen) return null;

  // Filter messages for current user or session
  const userEmail = currentUser?.email?.toLowerCase();
  const myMessages = customerMessages.filter((m) => {
    if (userEmail) {
      return m.email.toLowerCase() === userEmail;
    }
    return true; // show recent if non-logged session
  });

  const repliedMessages = myMessages.filter((m) => m.replyNotes || m.status === 'replied');
  
  // Recent notifications (Dashboard alerts)
  const myNotifications = notifications.slice(0, 10);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col max-h-[85vh] text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 bg-[#FAF7F2] border-b border-[#E8E8E3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#171717] tracking-tight">
                Store Notifications & Alerts
              </h3>
              <p className="text-[10px] text-[#6B6B6B]">
                Stay updated with your order status and store news
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllNotificationsAsRead}
                className="text-[10px] font-bold text-[#71883F] hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-[#6B6B6B] hover:text-[#171717] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-5 overflow-y-auto space-y-6">
          
          {/* Section: Order & System Updates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider block">
                Order & Store Updates
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>

            {myNotifications.length === 0 ? (
              <div className="p-6 text-center text-[#6B6B6B] bg-[#F7F8F3] rounded-xl border border-dashed border-[#E8E8E3] space-y-1 text-xs">
                <Sparkles className="w-6 h-6 text-neutral-300 mx-auto" />
                <p className="font-bold text-[#171717]">All Clear!</p>
                <p className="text-[11px]">No new updates or order alerts at the moment.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && markNotificationAsRead(notif.id)}
                    className={`p-3.5 rounded-xl border transition-all relative group ${
                      notif.read 
                        ? 'bg-white border-[#E8E8E3] opacity-80' 
                        : 'bg-[#EFF4E6]/30 border-[#71883F]/30 shadow-2xs'
                    }`}
                  >
                    {!notif.read && (
                      <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#71883F]" />
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg ${
                        notif.type === 'order' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {notif.type === 'order' ? <ShoppingBag className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${notif.read ? 'text-[#171717]' : 'text-[#71883F]'}`}>
                            {notif.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-[#A3A3A3] mt-2 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Admin Response Notes */}
          <div className="pt-4 border-t border-[#E8E8E3] space-y-3">
            <span className="text-[11px] font-bold text-[#71883F] uppercase tracking-wider block">
              Direct Support Replies ({repliedMessages.length})
            </span>

            {repliedMessages.length === 0 ? (
              <div className="p-4 text-center text-[#6B6B6B] bg-[#FAF7F2] rounded-xl border border-[#E8E8E3] space-y-1 text-xs opacity-60">
                <p className="font-medium">No active support threads</p>
              </div>
            ) : (
              repliedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#171717]">Support: {msg.subject || 'Inquiry'}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono">
                      Replied
                    </span>
                  </div>

                  {msg.replyNotes && (
                    <div className="p-3 bg-white border border-[#71883F]/20 rounded-lg text-xs space-y-1 text-[#171717]">
                      <div className="flex items-center gap-1.5 font-bold text-[#71883F] text-[11px]">
                        <CornerDownLeft className="w-3.5 h-3.5" /> Staff Response:
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed font-medium">
                        {msg.replyNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E8E3] flex items-center justify-between">
          <p className="text-[10px] text-[#6B6B6B]">Facing issues?</p>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenLiveChat) onOpenLiveChat();
            }}
            className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat with Team
          </button>
        </div>
      </div>
    </div>
  );
};

