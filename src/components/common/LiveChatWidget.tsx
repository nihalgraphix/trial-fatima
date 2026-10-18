import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, CheckCheck, Clock, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const LiveChatWidget: React.FC = () => {
  const { customerMessages, addCustomerMessage, storeSettings, showToast, currentUser } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState<string>(() => {
    return currentUser?.name || localStorage.getItem('fs_chat_name') || '';
  });
  const [email, setEmail] = useState<string>(() => {
    return currentUser?.email || localStorage.getItem('fs_chat_email') || '';
  });
  const [message, setMessage] = useState('');
  const [activeThreadEmail, setActiveThreadEmail] = useState<string>(() => {
    return currentUser?.email || localStorage.getItem('fs_chat_email') || '';
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync email when user logs in or changes
  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
      setActiveThreadEmail(currentUser.email);
      localStorage.setItem('fs_chat_email', currentUser.email);
    }
    if (currentUser?.name) {
      setName(currentUser.name);
      localStorage.setItem('fs_chat_name', currentUser.name);
    }
  }, [currentUser]);

  // Messages matching current customer's email or session
  const effectiveEmail = (activeThreadEmail || email).trim().toLowerCase();
  const myMessages = customerMessages.filter((m) => {
    if (effectiveEmail) {
      return m.email.toLowerCase() === effectiveEmail;
    }
    return false;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, myMessages.length]);

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || message).trim();
    if (!content) return;

    const senderName = name.trim() || currentUser?.name || 'Store Customer';
    const senderEmail = (email.trim() || activeThreadEmail.trim() || currentUser?.email || `customer_${Date.now().toString(36)}@fathimastores.com`).toLowerCase();

    // Persist identity in localStorage for future visits
    localStorage.setItem('fs_chat_name', senderName);
    localStorage.setItem('fs_chat_email', senderEmail);
    setActiveThreadEmail(senderEmail);
    setEmail(senderEmail);
    setName(senderName);

    addCustomerMessage({
      name: senderName,
      email: senderEmail,
      subject: 'Live Web Support Chat',
      message: content,
    });

    setMessage('');
    showToast('Message sent to Fathima Stores support! Admin will reply shortly.', 'success');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const quickPrompts = [
    'How long does standard delivery take?',
    'Do you have bulk discounts for schools & offices?',
    'Can I order custom art & calligraphy stationery?',
    'What are your store business hours?',
  ];

  // Check if there is an unread admin reply
  const unreadReplies = myMessages.filter((m) => m.replyNotes && m.status === 'replied');

  return (
    <>
      {/* Floating Web Live Chat Button */}
      <div className="fixed bottom-5 right-24 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ marginLeft: '0px', marginRight: '-73px', marginBottom: '46px' }}
          className="flex items-center gap-2 bg-[#71883F] hover:bg-[#5F7334] text-white px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer relative group"
          title="Live Support Chat"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold tracking-tight hidden sm:inline-block">
            Web Support Chat
          </span>

          {unreadReplies.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
              {unreadReplies.length}
            </span>
          )}
        </button>
      </div>

      {/* Web Live Chat Panel Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[380px] h-[520px] bg-white border border-[#E8E8E3] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 text-left">
          {/* Header */}
          <div className="p-4 bg-[#71883F] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 ring-2 ring-[#71883F]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight leading-tight">
                  {storeSettings?.storeName || 'FATHIMA STORES'} Live Support
                </h3>
                <span className="text-[10px] text-emerald-100 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3" /> Online · Real-time Admin Sync
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conversation Messages Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FAF7F2]">
            {/* Store Greeting */}
            <div className="flex items-start gap-2 max-w-[88%]">
              <div className="w-7 h-7 rounded-full bg-[#71883F] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                FS
              </div>
              <div className="p-3 bg-white border border-[#E8E8E3] rounded-2xl rounded-tl-xs text-xs text-[#171717] shadow-2xs leading-relaxed">
                <p className="font-bold text-[#71883F] mb-0.5">Fathima Stores Support</p>
                Hello! Welcome to Fathima Stores. How can we assist you today with stationery products, school supplies, or order delivery?
              </div>
            </div>

            {/* Quick Suggestions if no messages yet */}
            {myMessages.length === 0 && (
              <div className="pt-2 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#71883F]">
                  Frequently Asked Questions
                </p>
                <div className="flex flex-col gap-1.5">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs bg-white hover:bg-[#EFF4E6] text-[#171717] hover:text-[#5b6f32] border border-[#E8E8E3] hover:border-[#71883F]/40 px-3 py-2 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-98"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Message History */}
            {myMessages.map((msg) => (
              <React.Fragment key={msg.id}>
                {/* Customer Question Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] p-3 bg-[#71883F] text-white rounded-2xl rounded-tr-xs text-xs shadow-2xs leading-relaxed space-y-1">
                    <p className="font-semibold text-[10px] text-emerald-100">You ({msg.name})</p>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCheck className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Status Notice / Admin Reply Bubble */}
                {msg.replyNotes ? (
                  <div className="flex items-start gap-2 max-w-[88%]">
                    <div className="w-7 h-7 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                      Admin
                    </div>
                    <div className="p-3 bg-white border-2 border-[#71883F]/50 rounded-2xl rounded-tl-xs text-xs text-[#171717] shadow-xs space-y-1">
                      <div className="flex items-center justify-between gap-2 border-b border-[#E8E8E3] pb-1">
                        <span className="font-extrabold text-[#71883F] text-[11px]">Store Admin Reply</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                          Verified
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.replyNotes}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      <Clock className="w-3 h-3" />
                    </div>
                    <div className="p-2.5 bg-white/80 border border-[#E8E8E3] rounded-xl text-[11px] text-[#6B6B6B] leading-relaxed">
                      Your inquiry was sent to the store admin desk. We typically respond within minutes during business hours!
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* User Email & Name Input Bar */}
          {(!effectiveEmail || !currentUser) && (
            <div className="p-2.5 bg-neutral-50 border-t border-[#E8E8E3] grid grid-cols-2 gap-2 text-[11px]">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  localStorage.setItem('fs_chat_name', e.target.value);
                }}
                placeholder="Your Name (Optional)"
                className="px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg outline-none text-xs focus:border-[#71883F]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setActiveThreadEmail(e.target.value);
                  localStorage.setItem('fs_chat_email', e.target.value);
                }}
                placeholder="Your Email Address"
                className="px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg outline-none text-xs focus:border-[#71883F]"
              />
            </div>
          )}

          {/* Message Input Footer Form */}
          <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-[#E8E8E3] flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to admin..."
              className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
            />

            <button
              type="submit"
              disabled={!message.trim()}
              className="p-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl transition-colors cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
