import React, { useState, useMemo } from 'react';
import {
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Archive,
  MessageSquare,
  Send,
  Phone,
  User,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Inbox,
  AlertCircle,
  CornerDownLeft,
} from 'lucide-react';
import { CustomerMessage } from '../../types';
import { useStore } from '../../context/StoreContext';

export const AdminInboxView: React.FC = () => {
  const { customerMessages, updateCustomerMessageStatus, deleteCustomerMessage, showToast } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'unread' | 'read' | 'replied' | 'archived'>('all');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    customerMessages.length > 0 ? customerMessages[0].id : null
  );
  const [replyText, setReplyText] = useState('');

  // Stats
  const totalCount = customerMessages.length;
  const unreadCount = customerMessages.filter((m) => m.status === 'unread').length;
  const repliedCount = customerMessages.filter((m) => m.status === 'replied').length;
  const responseRate = totalCount > 0 ? Math.round((repliedCount / totalCount) * 100) : 100;

  // Filtered Messages
  const filteredMessages = useMemo(() => {
    return customerMessages.filter((msg) => {
      const matchesFilter =
        selectedStatusFilter === 'all' ? true : msg.status === selectedStatusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        msg.name.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        (msg.phone && msg.phone.toLowerCase().includes(q)) ||
        (msg.subject && msg.subject.toLowerCase().includes(q)) ||
        msg.message.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [customerMessages, selectedStatusFilter, searchQuery]);

  const activeMessage = useMemo(() => {
    if (!selectedMessageId) return filteredMessages[0] || customerMessages[0] || null;
    return customerMessages.find((m) => m.id === selectedMessageId) || filteredMessages[0] || null;
  }, [customerMessages, filteredMessages, selectedMessageId]);

  const handleSelectMessage = (msg: CustomerMessage) => {
    setSelectedMessageId(msg.id);
    if (msg.status === 'unread') {
      updateCustomerMessageStatus(msg.id, 'read');
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMessage) return;
    if (!replyText.trim()) {
      showToast('Please enter a reply note before sending.', 'error');
      return;
    }

    updateCustomerMessageStatus(activeMessage.id, 'replied', replyText.trim());
    showToast(`Reply note saved for ${activeMessage.name}! Marked as Replied.`, 'success');
    setReplyText('');
  };

  const applyTemplate = (templateNote: string) => {
    setReplyText((prev) => (prev ? `${prev}\n\n${templateNote}` : templateNote));
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-xs text-left">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E8E3] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#171717] tracking-tight">
                Customer Support & Inquiries Inbox
              </h2>
              <p className="text-[11px] text-[#6B6B6B] mt-0.2">
                Messages and inquiries submitted by store visitors through the Contact form.
              </p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E8E3]">
            <span className="text-[10px] text-[#6B6B6B] font-semibold uppercase block">Total Messages</span>
            <span className="text-sm font-extrabold text-[#171717]">{totalCount}</span>
          </div>

          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900">
            <span className="text-[10px] font-semibold uppercase block">Unread Inbox</span>
            <span className="text-sm font-extrabold">{unreadCount}</span>
          </div>

          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-900">
            <span className="text-[10px] font-semibold uppercase block">Replied</span>
            <span className="text-sm font-extrabold">{repliedCount}</span>
          </div>

          <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-200 text-sky-900">
            <span className="text-[10px] font-semibold uppercase block">Response Rate</span>
            <span className="text-sm font-extrabold">{responseRate}%</span>
          </div>
        </div>
      </div>

      {/* Main Two-Pane Inbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Message List & Filters */}
        <div className="lg:col-span-5 bg-white border border-[#E8E8E3] rounded-2xl shadow-2xs overflow-hidden flex flex-col min-h-[620px]">
          {/* Search & Filter Toolbar */}
          <div className="p-3.5 border-b border-[#E8E8E3] bg-[#FAF7F2] space-y-2.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages by name, email, topic..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F]"
              />
              <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-2.5 top-2.5" />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {(['all', 'unread', 'read', 'replied', 'archived'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors whitespace-nowrap cursor-pointer ${
                    selectedStatusFilter === st
                      ? 'bg-[#71883F] text-white shadow-2xs'
                      : 'bg-white text-[#6B6B6B] border border-[#E8E8E3] hover:text-[#171717]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Messages List Scrollable Pane */}
          <div className="divide-y divide-[#E8E8E3] overflow-y-auto max-h-[550px] flex-1">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-[#6B6B6B]">
                <Inbox className="w-8 h-8 text-[#E8E8E3] mx-auto" />
                <p className="font-semibold text-xs text-[#171717]">No messages found</p>
                <p className="text-[11px]">No form submissions match the selected filter or search query.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = activeMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-3.5 transition-colors cursor-pointer text-left relative ${
                      isSelected
                        ? 'bg-[#EFF4E6]/60 border-l-4 border-l-[#71883F]'
                        : msg.status === 'unread'
                        ? 'bg-amber-50/40 hover:bg-amber-50/70 font-semibold'
                        : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {msg.status === 'unread' && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        )}
                        <span className="font-bold text-[#171717] truncate">{msg.name}</span>
                      </div>
                      <span className="text-[10px] text-[#6B6B6B] shrink-0 font-mono">
                        {formatDate(msg.createdAt).split(',')[0]}
                      </span>
                    </div>

                    <p className="text-[11px] font-bold text-[#71883F] truncate mb-0.5">
                      {msg.subject || 'General Customer Inquiry'}
                    </p>

                    <p className="text-[11px] text-[#6B6B6B] line-clamp-2 leading-tight">
                      {msg.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-[#6B6B6B] font-mono">{msg.email}</span>

                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${
                          msg.status === 'unread'
                            ? 'bg-amber-100 text-amber-800'
                            : msg.status === 'replied'
                            ? 'bg-emerald-100 text-emerald-800'
                            : msg.status === 'archived'
                            ? 'bg-neutral-200 text-neutral-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Message Detailed Reader & Reply Drawer */}
        <div className="lg:col-span-7 bg-white border border-[#E8E8E3] rounded-2xl shadow-2xs overflow-hidden flex flex-col min-h-[620px]">
          {activeMessage ? (
            <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
              <div>
                {/* Action Bar & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E8E3] pb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        activeMessage.status === 'unread'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : activeMessage.status === 'replied'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}
                    >
                      Status: {activeMessage.status}
                    </span>
                    <span className="text-[11px] text-[#6B6B6B]">
                      Received: {formatDate(activeMessage.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateCustomerMessageStatus(
                          activeMessage.id,
                          activeMessage.status === 'unread' ? 'read' : 'unread'
                        )
                      }
                      className="p-1.5 hover:bg-[#FAF7F2] border border-[#E8E8E3] rounded-lg text-[#171717] transition-colors cursor-pointer"
                      title={activeMessage.status === 'unread' ? 'Mark as Read' : 'Mark as Unread'}
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#71883F]" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateCustomerMessageStatus(
                          activeMessage.id,
                          activeMessage.status === 'archived' ? 'read' : 'archived'
                        )
                      }
                      className="p-1.5 hover:bg-[#FAF7F2] border border-[#E8E8E3] rounded-lg text-[#171717] transition-colors cursor-pointer"
                      title={activeMessage.status === 'archived' ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="w-4 h-4 text-[#6B6B6B]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        deleteCustomerMessage(activeMessage.id);
                        showToast('Customer message deleted.', 'info');
                      }}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Delete Message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sender Profile Header */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E8E3] my-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#71883F] text-white flex items-center justify-center font-extrabold text-sm shadow-2xs">
                      {activeMessage.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#171717]">{activeMessage.name}</h3>
                      <p className="text-[11px] text-[#6B6B6B]">{activeMessage.email}</p>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${activeMessage.email}?subject=Re: ${encodeURIComponent(
                        activeMessage.subject || 'Fathima Stores Customer Support'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-[#171717] border border-[#E8E8E3] rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#71883F]" /> Email
                    </a>

                    {activeMessage.phone && (
                      <a
                        href={`https://wa.me/${activeMessage.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${activeMessage.name}, regarding your message to Fathima Stores: "${activeMessage.subject || ''}"`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {/* Subject Title */}
                <div className="mb-4">
                  <span className="text-[10px] text-[#6B6B6B] font-semibold uppercase tracking-wider block mb-1">
                    Inquiry Topic
                  </span>
                  <h4 className="text-base font-extrabold text-[#171717]">
                    {activeMessage.subject || 'General Customer Inquiry'}
                  </h4>
                </div>

                {/* Full Message Body */}
                <div className="bg-white border border-[#E8E8E3] p-4 rounded-xl text-xs text-[#171717] leading-relaxed whitespace-pre-wrap font-sans">
                  {activeMessage.message}
                </div>

                {/* Display Saved Admin Reply if present */}
                {activeMessage.replyNotes && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <CornerDownLeft className="w-4 h-4 text-emerald-600" /> Recorded Admin Reply Note
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700">Replied</span>
                    </div>
                    <p className="text-xs text-emerald-950 font-medium whitespace-pre-wrap leading-relaxed">
                      {activeMessage.replyNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Reply Compose Form */}
              <div className="pt-4 border-t border-[#E8E8E3] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#171717] flex items-center gap-1.5 text-xs">
                    <MessageSquare className="w-4 h-4 text-[#71883F]" />
                    <span>Compose Admin Reply & Record Activity</span>
                  </label>
                  <span className="text-[10px] text-[#6B6B6B]">Select quick response template:</span>
                </div>

                {/* Template Chips */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      applyTemplate(
                        `Thank you for contacting Fathima Stores! We have received your inquiry regarding "${activeMessage.subject || 'your request'}". Our team is preparing your response.`
                      )
                    }
                    className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#EFF4E6] border border-[#E8E8E3] text-[#171717] rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    + Standard Acknowledgement
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyTemplate(
                        'Our bulk sales institutional team has processed your request and generated a custom quotation with school/office discounts.'
                      )
                    }
                    className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#EFF4E6] border border-[#E8E8E3] text-[#171717] rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    + Wholesale Bulk Quote
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyTemplate(
                        'Your order status has been updated and handed over to our dedicated delivery personnel for express fulfillment.'
                      )
                    }
                    className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#EFF4E6] border border-[#E8E8E3] text-[#171717] rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    + Delivery Update
                  </button>
                </div>

                <form onSubmit={handleSendReply} className="space-y-2.5">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type reply note or response details here..."
                    className="w-full p-3 border border-[#E8E8E3] rounded-xl outline-none focus:border-[#71883F] text-xs text-[#171717] bg-white"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Record Admin Reply Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[#6B6B6B] my-auto space-y-2">
              <Mail className="w-10 h-10 text-[#E8E8E3] mx-auto" />
              <p className="font-bold text-sm text-[#171717]">Select a message to view details</p>
              <p className="text-xs">Choose a message from the left list to read and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
