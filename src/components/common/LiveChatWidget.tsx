import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, CheckCheck, Clock, Phone, Sparkles, Bell } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const LiveChatWidget: React.FC = () => {
  const { customerMessages, addCustomerMessage, storeSettings, showToast, currentUser } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [message, setMessage] = useState('');
  const [activeThreadEmail, setActiveThreadEmail] = useState<string>(currentUser?.email || '');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync email when user logs in or changes
  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
      setActiveThreadEmail(currentUser.email);
    }
    if (currentUser?.name) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  // Messages matching current customer's email or session
  const myMessages = customerMessages.filter((m) => {
    if (activeThreadEmail) {
      return m.email.toLowerCase() === activeThreadEmail.toLowerCase();
    }
    return true; // if no email set, show recent messages
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, myMessages.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const senderName = name.trim() || 'Valued Customer';
    const senderEmail = email.trim() || 'customer@fathimastores.com';

    addCustomerMessage({
      name: senderName,
      email: senderEmail,
      subject: 'Live Web Support Chat',
      message: message.trim(),
    });

    setActiveThreadEmail(senderEmail);
    setMessage('');
    showToast('Message sent to Fathima Stores support! Admin will reply shortly.', 'success');
  };

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
                  <Sparkles className="w-3 h-3" /> Online · Instant Admin Inbox Sync
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
            <div className="flex items-start gap-2 max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-[#71883F] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                FS
              </div>
              <div className="p-3 bg-white border border-[#E8E8E3] rounded-2xl rounded-tl-xs text-xs text-[#171717] shadow-2xs leading-relaxed">
                <p className="font-bold text-[#71883F] mb-0.5">Fathima Stores Support</p>
                Hello! How can we assist you today with stationery products, bulk orders, or order tracking?
              </div>
            </div>

            {/* Customer Message History */}
            {myMessages.length === 0 ? (
              <div className="text-center py-6 text-[#6B6B6B] text-[11px] space-y-1">
                <Clock className="w-5 h-5 mx-auto text-neutral-300" />
                <p>No previous messages in this session.</p>
                <p>Type your message below to chat directly with store admin.</p>
              </div>
            ) : (
              myMessages.map((msg) => (
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

                  {/* Admin Reply Bubble */}
                  {msg.replyNotes && (
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <div className="w-7 h-7 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                        Admin
                      </div>
                      <div className="p-3 bg-white border-2 border-[#71883F]/40 rounded-2xl rounded-tl-xs text-xs text-[#171717] shadow-xs space-y-1">
                        <div className="flex items-center justify-between gap-2 border-b border-[#E8E8E3] pb-1">
                          <span className="font-extrabold text-[#71883F] text-[11px]">Store Admin Reply</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                            Official
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.replyNotes}</p>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* User Email & Name Input Bar */}
          {(!activeThreadEmail || !currentUser) && (
            <div className="p-2 bg-neutral-50 border-t border-[#E8E8E3] grid grid-cols-2 gap-2 text-[11px]">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name..."
                className="px-2 py-1 bg-white border border-[#E8E8E3] rounded-md outline-none text-xs"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setActiveThreadEmail(e.target.value);
                }}
                placeholder="Your Email..."
                className="px-2 py-1 bg-white border border-[#E8E8E3] rounded-md outline-none text-xs"
              />
            </div>
          )}

          {/* Message Input Footer Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#E8E8E3] flex items-center gap-2">
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
