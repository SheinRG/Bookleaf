"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL, getAuthToken } from '@/lib/api';

interface ChatWorkspaceProps {
  selectedTicket: any;
  admins: any[];
  user: any;
  onUpdateTicket: (updates: any) => Promise<void>;
}

export default function ChatWorkspace({
  selectedTicket,
  admins,
  user,
  onUpdateTicket
}: ChatWorkspaceProps) {
  // Navigation & Resizing State
  const [replyHeight, setReplyHeight] = useState(140);
  const [isResizingReply, setIsResizingReply] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reply Composer State
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Header Dropdown state
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages?.length]);

  // Resizing Composer Height Handlers
  const startResizeReply = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingReply(true);
  };

  useEffect(() => {
    if (!isResizingReply) return;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.movementY;
      setReplyHeight(prev => {
        const next = prev - deltaY;
        return next > 90 && next < 450 ? next : prev;
      });
    };
    const handleMouseUp = () => setIsResizingReply(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingReply]);

  // Trigger API Draft Generator (Dynamic context-aware history payload!)
  const generateDraft = async () => {
    setIsDrafting(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/tickets/${selectedTicket._id}/draft`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.draft) {
        setReplyMessage(data.draft);
        setIsFocused(true); // Expand composer to fit
      } else {
        alert(data.error || 'Failed to generate AI draft. Check backend keys.');
      }
    } catch (e) {
      alert('AI draft network failure.');
    }
    setIsDrafting(false);
  };

  const handleSend = async () => {
    if (!replyMessage.trim()) return;
    await onUpdateTicket({
      new_message: replyMessage,
      is_internal: isInternal
    });
    setReplyMessage('');
    setIsInternal(false);
    setIsFocused(false);
  };

  const handleAdminAssign = async (adminId: string) => {
    await onUpdateTicket({ assigned_admin: adminId });
    setAssignOpen(false);
  };

  if (!selectedTicket) {
    return (
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-background relative select-none overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Animated Icon Container */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-surface-container to-surface-container-high border border-outline-variant/30 shadow-2xl flex items-center justify-center mb-8 relative group cursor-default"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            <span className="material-symbols-outlined text-[42px] text-primary/80 drop-shadow-md">forum</span>
            
            {/* Notification Badge Dot */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full border-2 border-background shadow-sm"
            />
          </motion.div>

          <h2 className="text-[28px] font-black text-on-surface tracking-tight mb-3">
            Your Workspace
          </h2>
          <p className="text-[15px] text-on-surface-variant/70 max-w-[320px] leading-relaxed font-medium">
            Select a ticket from the inbox to start helping authors and resolving issues.
          </p>

          {/* Quick Stats or Decorative UI underneath */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-10 flex items-center gap-4 text-[13px] font-bold text-on-surface-variant/50"
          >
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/20 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
              <span>Fast Responses</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/20 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-amber-500">auto_awesome</span>
              <span>AI Assisted</span>
            </div>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col bg-background relative select-none">
      
      {/* 1. Header Detail Navigation with Premium Actions */}
      <header className="header-glass h-[72px] shrink-0 border-b border-outline-variant/30 flex items-center px-6 sticky top-0 z-30 justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-on-surface-variant text-sm font-bold">{selectedTicket.author?.name?.charAt(0) || '?'}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-[14px] md:text-[15px] font-bold text-on-surface truncate max-w-[280px] md:max-w-[400px]">{selectedTicket.subject}</h2>
              <span className="bg-surface-container-high text-on-surface-variant/70 px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0">#{selectedTicket._id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[12px] text-on-surface-variant/60 font-semibold">{selectedTicket.author?.name}</span>
              {selectedTicket.book && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-outline" />
                  <span className="text-[12px] text-on-surface-variant/60 italic font-medium truncate max-w-[200px]">{selectedTicket.book.title}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Priority, Status, and Admin Assignment dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Assignment dropdown removed as per user request */}

          {/* Category Capsule */}
          <div className="relative">
            <button 
              onClick={() => { setCategoryOpen(!categoryOpen); setPriorityOpen(false); setStatusOpen(false); setAssignOpen(false); }}
              className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-primary cursor-pointer hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">sell</span>
              {selectedTicket.category}
              <svg className={`w-3 h-3 transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {categoryOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg p-1 z-50 min-w-[210px]"
                >
                  {[
                    'Royalty & Payments',
                    'ISBN & Metadata Issues',
                    'Printing & Quality',
                    'Distribution & Availability',
                    'Book Status & Production Updates',
                    'General Inquiry'
                  ].map(c => (
                    <button
                      key={c}
                      onClick={() => { onUpdateTicket({ category: c }); setCategoryOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${selectedTicket.category === c ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-low'}`}
                    >
                      {c}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Priority Capsule */}
          <div className="relative">
            <button 
              onClick={() => { setPriorityOpen(!priorityOpen); setStatusOpen(false); setAssignOpen(false); setCategoryOpen(false); }}
              className={`priority-${selectedTicket.priority.toLowerCase()} flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:brightness-95 transition-all`}
            >
              {selectedTicket.priority === 'Critical' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />}
              {selectedTicket.priority}
              <svg className={`w-3 h-3 transition-transform duration-200 ${priorityOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {priorityOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg p-1 z-50 min-w-[120px]"
                >
                  {['Critical', 'High', 'Medium', 'Low'].map(p => (
                    <button
                      key={p}
                      onClick={() => { onUpdateTicket({ priority: p }); setPriorityOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${selectedTicket.priority === p ? 'bg-primary/5 text-primary' : 'text-on-surface hover:bg-surface-container-low'}`}
                    >
                      {p}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Capsule */}
          <div className="relative">
            <button 
              onClick={() => { setStatusOpen(!statusOpen); setPriorityOpen(false); setAssignOpen(false); setCategoryOpen(false); }}
              className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition-all"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${selectedTicket.status === 'Open' ? 'bg-error' : selectedTicket.status === 'Resolved' || selectedTicket.status === 'Closed' ? 'bg-green-500' : 'bg-primary'}`} />
              {selectedTicket.status}
              <svg className={`w-3 h-3 transition-transform duration-200 ${statusOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {statusOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 4, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg p-1 z-50 min-w-[130px]"
                >
                  {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
                    <button
                      key={s}
                      onClick={() => { onUpdateTicket({ status: s }); setStatusOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${selectedTicket.status === s ? 'bg-primary/5 text-primary' : 'text-on-surface hover:bg-surface-container-low'}`}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick-action Mark as Closed button */}
          {selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved' && (
            <button
              onClick={() => onUpdateTicket({ status: 'Closed' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-all bg-green-600/10 border border-green-600/30 text-green-700 hover:bg-green-600/20"
              title="Mark ticket as closed"
            >
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Close
            </button>
          )}
        </div>
      </header>

      {/* 2. Messages conversation stream */}
      <div className="flex-1 overflow-y-auto chat-bg-pattern custom-scrollbar pb-[220px] px-6 pt-6 flex flex-col selection:bg-primary/10">
        {selectedTicket.messages.map((msg: any, idx: number) => {
          const prevMsg = idx > 0 ? selectedTicket.messages[idx - 1] : null;
          const prevSenderId = prevMsg ? (typeof prevMsg.sender === 'object' ? prevMsg.sender?._id : prevMsg.sender) : null;
          const currentSenderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
          const isSameSender = prevMsg && (prevSenderId === currentSenderId) && (prevMsg.isInternal === msg.isInternal);
          
          const msgSenderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
          const isAuthor = msg.sender?.role === 'author' || (msgSenderId && (selectedTicket.author?._id || selectedTicket.author)?.toString() === msgSenderId.toString());
          const isAdmin = !isAuthor;
          const timeStr = new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

          return msg.isInternal ? (
            <div key={idx} className={`flex justify-end msg-internal ${isSameSender ? 'mt-1' : 'mt-5'}`}>
              <div className="flex items-end gap-2 max-w-[70%]">
                <div className={`bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 text-amber-900 px-4 py-2.5 shadow-sm ${
                  isSameSender ? 'rounded-2xl rounded-br-lg' : 'rounded-2xl rounded-br-sm'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-amber-200/50">
                    <span className="material-symbols-outlined text-amber-600 text-[14px]">lock</span>
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Internal Note</span>
                  </div>
                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed select-text">{msg.message}</p>
                  <span className="text-[10px] text-amber-600/60 mt-1.5 block text-right font-mono font-medium">{timeStr}</span>
                </div>
              </div>
            </div>
          ) : isAdmin ? (
            <div key={idx} className={`flex justify-end msg-admin ${isSameSender ? 'mt-1' : 'mt-5'}`}>
              <div className="flex items-end gap-2 max-w-[70%]">
                <div className={`bg-primary text-white px-4 py-2.5 shadow-sm ${
                  isSameSender ? 'rounded-2xl rounded-br-lg' : 'rounded-2xl rounded-br-sm'
                }`}>
                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed select-text">{msg.message}</p>
                  <span className="text-[10px] text-white/50 mt-1.5 block text-right font-mono font-medium">{timeStr}</span>
                </div>
              </div>
            </div>
          ) : (
            <div key={idx} className={`flex justify-start msg-author ${isSameSender ? 'mt-1' : 'mt-5'}`}>
              <div className="flex items-end gap-2 max-w-[70%]">
                {!isSameSender ? (
                  <div className="w-7 h-7 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center shadow-sm mb-0.5 border border-outline-variant/10">
                    <span className="text-[10px] font-black text-on-surface-variant">{msg.sender?.name?.charAt(0) || '?'}</span>
                  </div>
                ) : (
                  <div className="w-7 shrink-0" />
                )}
                <div className={`bg-white border border-outline-variant/20 text-on-surface px-4 py-2.5 shadow-sm ${
                  isSameSender ? 'rounded-2xl rounded-bl-lg' : 'rounded-2xl rounded-bl-sm'
                }`}>
                  {!isSameSender && (
                    <p className="text-[10px] font-black text-primary mb-1">{msg.sender?.name || 'Author'}</p>
                  )}
                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed select-text">{msg.message}</p>
                  <span className="text-[10px] text-on-surface-variant/40 mt-1.5 block font-mono font-medium">{timeStr}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} className="h-6" />
      </div>

      {/* 3. Floating composer box with resizer handle */}
      <div className="absolute bottom-5 left-5 right-5 z-30 pointer-events-none">
        {(() => {
          const isExpanded = isFocused || replyMessage.trim() !== '';
          return (
            <motion.div 
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`composer-card max-w-3xl mx-auto pointer-events-auto relative flex flex-col transition-colors duration-300 ${
                isExpanded 
                  ? `rounded-2xl p-4 shadow-2xl border backdrop-blur-xl ${isInternal ? 'bg-amber-50/95 border-amber-300/50' : 'bg-white/95 border-outline-variant/40 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10'}` 
                  : 'rounded-full py-2.5 px-5 bg-white border border-outline-variant/60 shadow-md hover:shadow-lg hover:border-primary/30 cursor-text'
              }`}
              onClick={() => {
                if (!isExpanded) setIsFocused(true);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setIsFocused(false);
                }
              }}
            >
              {/* Resizer Handle */}
              {isExpanded && (
                <div 
                  onMouseDown={startResizeReply}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-outline-variant/40 rounded-full cursor-row-resize hover:bg-primary/40 transition-colors"
                  title="Drag to resize reply input height"
                />
              )}

              {/* Input Area */}
              <textarea 
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                style={{ height: isExpanded ? `${replyHeight}px` : '24px' }}
                className={`w-full bg-transparent border-none focus:ring-0 resize-none outline-none custom-scrollbar transition-colors duration-200 text-[14px] text-on-surface ${
                  isExpanded ? 'leading-relaxed' : 'leading-6'
                }`}
                placeholder={isInternal && isExpanded ? "Write a private internal note..." : `Message ${selectedTicket.author?.name || 'author'}...`}
              />

              {/* Collapsed input placeholder button triggers */}
              {!isExpanded && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); generateDraft(); }}
                    className="p-1 hover:bg-primary/5 rounded-full text-primary transition-colors cursor-pointer"
                    title="Generate AI Draft response"
                  >
                    <span className="material-symbols-outlined text-[16px] animate-pulse">auto_awesome</span>
                  </button>
                </div>
              )}

              {/* Composer Footer Actions */}
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between pt-3 mt-2 border-t border-outline-variant/20 select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 border-r border-outline-variant/20 pr-3">
                      <input 
                        type="file" 
                        id="admin-file-upload" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            alert(`File "${e.target.files[0].name}" selected (Storage uploads coming soon!).`);
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => document.getElementById('admin-file-upload')?.click()}
                        onMouseDown={(e) => e.preventDefault()}
                        className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors text-outline flex items-center justify-center cursor-pointer"
                        title="Attach file"
                      >
                        <span className="material-symbols-outlined text-[18px]">attach_file</span>
                      </button>
                      <motion.button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={generateDraft}
                        disabled={isDrafting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="ai-glow text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                      >
                        <motion.span 
                          animate={isDrafting ? { rotate: 360 } : { rotate: [0, 15, -15, 0] }}
                          transition={isDrafting ? { repeat: Infinity, duration: 1, ease: "linear" } : { repeat: Infinity, duration: 2, repeatDelay: 2 }}
                          className="flex items-center animate-pulse"
                        >
                          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        </motion.span>
                        {isDrafting ? 'AI drafting...' : 'AI Draft'}
                      </motion.button>
                    </div>
                    
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="w-3.5 h-3.5 text-primary border-outline-variant rounded focus:ring-primary cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-on-surface-variant/60 group-hover:text-on-surface-variant transition-colors uppercase tracking-wider">Internal note</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setReplyMessage(''); 
                        setIsInternal(false);
                        setIsFocused(false);
                      }} 
                      className="px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant hover:text-error rounded-lg hover:bg-error/5 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Discard
                    </button>
                    <button 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSend();
                      }}
                      disabled={!replyMessage.trim()}
                      className="bg-primary text-white px-4 py-1.5 rounded-lg text-[11px] font-bold shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <span>Send</span>
                      <span className="material-symbols-outlined text-[14px]">send</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })()}
      </div>
    </section>
  );
}
