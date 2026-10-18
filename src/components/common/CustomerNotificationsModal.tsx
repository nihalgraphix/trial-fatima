import React from 'react';
import { X, Bell, MessageSquare, CheckCircle2, Clock, CornerDownLeft, Sparkles, ArrowRight } from 'lucide-react';
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
  const { customerMessages, currentUser, orders } = useStore();

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
                Store Notifications & Admin Replies
              </h3>
              <p className="text-[10px] text-[#6B6B6B]">
                View response notes from Fathima Stores support team
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#6B6B6B] hover:text-[#171717] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-5 overflow-y-auto space-y-4 divide-y divide-[#E8E8E3]">
          {/* Section: Admin Replied Messages */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-[#71883F] uppercase tracking-wider block">
              Admin Response Notes ({repliedMessages.length})
            </span>

            {repliedMessages.length === 0 ? (
              <div className="p-6 text-center text-[#6B6B6B] bg-[#FAF7F2] rounded-xl border border-[#E8E8E3] space-y-1 text-xs">
                <Clock className="w-6 h-6 text-neutral-300 mx-auto" />
                <p className="font-bold text-[#171717]">No Admin Replies Yet</p>
                <p className="text-[11px]">When an admin responds to your inquiry or chat, the response note will appear here.</p>
              </div>
            ) : (
              repliedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 bg-white border border-[#E8E8E3] rounded-xl space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#171717]">Topic: {msg.subject || 'Inquiry'}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono">
                      Replied
                    </span>
                  </div>

                  <p className="text-[11px] text-[#6B6B6B] italic border-l-2 border-neutral-300 pl-2">
                    "{msg.message}"
                  </p>

                  {/* Admin Reply Note Box */}
                  {msg.replyNotes && (
                    <div className="p-3 bg-[#EFF4E6]/80 border border-[#71883F]/30 rounded-lg text-xs space-y-1 text-[#171717]">
                      <div className="flex items-center gap-1.5 font-bold text-[#71883F] text-[11px]">
                        <CornerDownLeft className="w-3.5 h-3.5" /> Official Admin Reply:
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

          {/* Section: All Inquiries Submitted */}
          <div className="pt-3 space-y-2">
            <span className="text-[11px] font-bold text-[#171717] uppercase tracking-wider block">
              Your Inquiries History ({myMessages.length})
            </span>

            {myMessages.length > 0 &&
              myMessages.slice(0, 3).map((msg) => (
                <div key={msg.id} className="p-2.5 bg-[#FAF7F2] rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#171717]">{msg.subject || 'General Message'}</p>
                    <p className="text-[10px] text-[#6B6B6B] line-clamp-1">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-[#6B6B6B] font-mono shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#E8E8E3] flex items-center justify-between">
          <p className="text-[10px] text-[#6B6B6B]">Need urgent assistance?</p>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenLiveChat) onOpenLiveChat();
            }}
            className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Open Web Live Chat
          </button>
        </div>
      </div>
    </div>
  );
};
