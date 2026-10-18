import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  MessageSquare,
  X,
  Send,
  Headphones,
  CheckCheck,
  Package,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const SupportChatWidget: React.FC = () => {
  const {
    currentUser,
    orders,
    supportThreads,
    createSupportThread,
    sendSupportMessage,
    isSupportChatOpen,
    setIsSupportChatOpen,
  } = useStore();

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState('Order & Store Inquiry');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // User's threads
  const userThreads = supportThreads.filter((t) =>
    currentUser ? t.customerId === currentUser.id || t.customerEmail === currentUser.email : true
  );

  const activeThread = supportThreads.find((t) => t.id === activeThreadId) || userThreads[0];

  useEffect(() => {
    if (activeThread) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages?.length, isSupportChatOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    if (!activeThread) {
      // Create new thread
      const created = createSupportThread(
        newSubject,
        messageText.trim(),
        selectedOrderId || undefined
      );
      setActiveThreadId(created.id);
    } else {
      sendSupportMessage(activeThread.id, messageText.trim(), 'customer');
    }

    setMessageText('');
  };

  const quickPrompts = [
    { label: '📦 Where is my order?', subject: 'Delivery & Shipping Update' },
    { label: '🔄 Return / Replacement help', subject: 'Return Request Inquiry' },
    { label: '💳 Payment or Invoice query', subject: 'Payment & Receipt Inquiry' },
    { label: '🏷️ Bulk school/office discount', subject: 'Bulk Stationery Quotation' },
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsSupportChatOpen(!isSupportChatOpen)}
          className="relative px-4 py-3 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group active:scale-95"
          aria-label="Customer Support Live Chat"
        >
          <Headphones className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-xs font-bold hidden sm:inline">Live Store Support</span>
          {/* Subtle online beacon */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
          </span>
        </button>
      </div>

      {/* Floating Chat Drawer / Modal */}
      {isSupportChatOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E8E8E3] overflow-hidden flex flex-col h-[520px] animate-in fade-in slide-in-from-bottom-4 duration-200 text-left">
          {/* Header */}
          <div className="bg-[#171717] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#71883F] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">Fathima Stores Support</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-neutral-300">Staff Online · Quick Reply</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSupportChatOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conversation Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF9F6] text-xs">
            {/* Store Welcome Banner */}
            <div className="bg-white border border-[#E8E8E3] rounded-xl p-3 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#71883F] font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" /> Welcome to Customer Care
              </div>
              <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                Need help with your stationery order, courier delivery tracking, or invoices? Send us a message and our team will assist you immediately.
              </p>
            </div>

            {/* Quick Prompts if starting or no messages */}
            {(!activeThread || activeThread.messages.length === 0) && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                  Frequently Asked:
                </span>
                <div className="flex flex-col gap-1.5">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setNewSubject(q.subject);
                        setMessageText(q.label.replace(/^.+?\s/, ''));
                      }}
                      className="text-left px-2.5 py-1.5 bg-white border border-[#E8E8E3] hover:border-[#71883F] hover:bg-[#EFF4E6]/50 rounded-lg text-[11px] text-[#171717] font-medium transition-colors"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Thread */}
            {activeThread && (
              <div className="space-y-2.5 pt-1">
                <div className="text-center my-2">
                  <span className="text-[10px] bg-[#E8E8E3] text-[#6B6B6B] px-2 py-0.5 rounded-full font-medium">
                    {activeThread.subject} {activeThread.orderId ? `(Order #${activeThread.orderId})` : ''}
                  </span>
                </div>

                {activeThread.messages.map((msg) => {
                  const isMe = msg.senderRole === 'customer';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-2xs ${
                          isMe
                            ? 'bg-[#71883F] text-white rounded-br-xs'
                            : 'bg-white border border-[#E8E8E3] text-[#171717] rounded-bl-xs'
                        }`}
                      >
                        {!isMe && (
                          <span className="block text-[10px] font-bold text-[#71883F] mb-0.5">
                            {msg.senderName} (Support)
                          </span>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <span className="text-[9px] text-[#8C8C8C] mt-0.5 px-1 flex items-center gap-1">
                        {msg.timestamp}
                        {isMe && <CheckCheck className="w-3 h-3 text-[#71883F]" />}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Optional Order Reference Bar if customer has orders */}
          {orders.length > 0 && !activeThread && (
            <div className="px-3 py-1.5 bg-[#F2F2EE] border-t border-[#E8E8E3] flex items-center gap-2 text-[11px]">
              <Package className="w-3.5 h-3.5 text-[#6B6B6B] shrink-0" />
              <span className="text-[#6B6B6B] text-[10px] shrink-0">Link Order:</span>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full text-[10px] bg-white border border-[#E8E8E3] rounded px-1.5 py-0.5 outline-none font-semibold text-[#171717]"
              >
                <option value="">None (General Store Inquiry)</option>
                {orders.slice(0, 5).map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} - ₹{o.total} ({o.orderStatus})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Composer Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-[#E8E8E3] flex items-center gap-2"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 text-xs bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] text-[#171717]"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="w-9 h-9 rounded-xl bg-[#71883F] hover:bg-[#5F7334] disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
