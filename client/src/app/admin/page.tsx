"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken, getUser, logout } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Navigation & Resizing State
  const [activeTab, setActiveTab] = useState<'messages' | 'manuscripts' | 'royalties'>('messages');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [queueWidth, setQueueWidth] = useState(380);
  const [isResizingQueue, setIsResizingQueue] = useState(false);
  const [replyHeight, setReplyHeight] = useState(160);
  const [isResizingReply, setIsResizingReply] = useState(false);

  // Tickets Data
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reply Box State
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Capsule Select State
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Manuscripts & Royalties Data
  const [books, setBooks] = useState<any[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Fetch Tickets
  const fetchTickets = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/tickets`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        // Refresh selected ticket context
        setSelectedTicket((prev: any) => {
          if (!prev) return prev;
          const updated = data.find((t: any) => t._id === prev._id);
          return updated || prev;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Books
  const fetchBooks = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/books`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setBooks(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    const currentUser = getUser();
    if (!token || !currentUser || currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchTickets(token);
    fetchBooks(token);

    const interval = setInterval(() => {
      fetchTickets(token);
      fetchBooks(token);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Drag resizer handlers
  const startResizeQueue = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingQueue(true);
  };

  const startResizeReply = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingReply(true);
  };

  useEffect(() => {
    if (!isResizingQueue) return;
    const handleMouseMove = (e: MouseEvent) => {
      const sidebarWidth = sidebarOpen ? 280 : 84;
      const newWidth = e.clientX - sidebarWidth;
      if (newWidth > 280 && newWidth < 600) {
        setQueueWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizingQueue(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingQueue, sidebarOpen]);

  useEffect(() => {
    if (!isResizingReply) return;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.movementY;
      setReplyHeight(prev => {
        const next = prev - deltaY;
        return next > 100 && next < 450 ? next : prev;
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

  const updateTicket = async (updates: any) => {
    if (!selectedTicket) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/tickets/${selectedTicket._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchTickets(token as string);
        if (updates.new_message) {
          setReplyMessage('');
          setIsInternal(false);
        }
      }
    } catch (e) {
      alert('Failed to update ticket');
    }
  };

  // Publish / Status update book
  const updateBookStatus = async (bookId: string, newStatus: string) => {
    const token = getAuthToken();
    setIsActionLoading(bookId);
    try {
      const res = await fetch(`${API_URL}/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        await fetchBooks(token as string);
      } else {
        alert('Failed to update manuscript status.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(null);
    }
  };

  // Pay royalties
  const payRoyalties = async (bookId: string) => {
    const token = getAuthToken();
    setIsActionLoading(bookId);
    try {
      const res = await fetch(`${API_URL}/books/${bookId}/payout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchBooks(token as string);
      } else {
        alert('Failed to process royalty payment.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(null);
    }
  };

  const generateDraft = async () => {
    if (!selectedTicket) return;
    setIsDrafting(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/tickets/${selectedTicket._id}/draft`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.draft) {
        setReplyMessage(data.draft);
        setIsFocused(true); // Expand the text box to show the draft
      } else {
        alert(data.error || 'Failed to generate draft');
      }
    } catch (e) {
      alert('Failed to generate draft — network error');
    }
    setIsDrafting(false);
  };

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700 pulse-critical';
      case 'High': return 'bg-primary-container text-on-primary-container';
      case 'Medium': return 'bg-secondary-fixed text-on-secondary-fixed';
      case 'Low': return 'bg-surface-container-highest text-secondary';
      default: return 'bg-surface-container-highest text-secondary';
    }
  };

  // Filtered tickets based on state searchQuery
  const filteredTickets = tickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.author?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface font-body-md">
      
      {/* 1. Premium Dark Sidebar */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-gradient-to-b from-[#1c1b1b] to-[#2a2123] border-r border-[#3a2f31] text-white/90 flex flex-col h-full py-5 px-3 shrink-0 z-40 relative select-none overflow-hidden"
      >
        {/* Brand/Logo — Toggles Sidebar */}
        <div 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="px-2 mb-8 flex items-center gap-3 cursor-pointer group"
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <motion.div
            whileHover={{ scale: 1.06 }}
            className="w-10 h-10 rounded-xl bg-primary/90 flex items-center justify-center shadow-lg shrink-0"
          >
            <span className="material-symbols-outlined text-white text-[22px]">menu_book</span>
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <h1 className="text-[18px] font-bold text-white tracking-tight leading-tight">BookLeaf</h1>
                <p className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium">Admin Console</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-1">
          {[
            { id: 'messages' as const, icon: 'forum', label: 'Messages', badge: tickets.filter(t => t.status === 'Open').length },
            { id: 'manuscripts' as const, icon: 'auto_stories', label: 'Manuscripts' },
            { id: 'royalties' as const, icon: 'account_balance_wallet', label: 'Royalties' },
          ].map(item => (
            <motion.div 
              key={item.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-nav-item flex items-center gap-3 px-3 py-2.5 cursor-pointer ${
                activeTab === item.id ? 'active' : ''
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${activeTab === item.id ? 'text-primary-fixed-dim' : 'text-white/50'}`}>{item.icon}</span>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-between min-w-0"
                  >
                    <span className={`text-[13px] font-medium ${activeTab === item.id ? 'text-white' : 'text-white/60'}`}>{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="bg-primary text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">{item.badge}</span>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </nav>

        {/* User Section & Logout */}
        <div className="mt-auto space-y-3 px-1">
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-3 py-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary-fixed-dim text-xs font-bold">{user?.name?.charAt(0) || 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[12px] font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-white/30 text-[10px] truncate">{user?.email || ''}</p>
              </div>
            </motion.div>
          )}
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {sidebarOpen && <span className="text-[12px] font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Splitted Content Pane */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Dynamic Views switching */}
        <AnimatePresence mode="wait">
          {activeTab === 'messages' && (
            <motion.div 
              key="messages"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex overflow-hidden"
            >
              
              {/* Left Pane: Ticket Queue */}
              <section 
                style={{ width: `${queueWidth}px` }}
                className="min-w-[300px] max-w-[600px] border-r border-outline-variant/50 bg-white flex flex-col z-20 shrink-0 relative"
              >
                {/* Queue Header */}
                <div className="queue-header p-4 pb-3 space-y-3 z-10 border-b border-outline-variant/30">
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                      <span className="material-symbols-outlined text-[18px]">search</span>
                    </div>
                    <input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low/60 border-none rounded-xl text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline" 
                      placeholder="Search tickets..." 
                      type="text"
                    />
                  </div>
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-[0.12em]">Inbox · {filteredTickets.length}</span>
                  </div>
                </div>

                {/* Scrollable Queue */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {filteredTickets.map((ticket, tIdx) => {
                    const isActive = selectedTicket?._id === ticket._id;
                    const priorityClass = `priority-${ticket.priority.toLowerCase()}`;
                    const lastMsg = ticket.messages?.[ticket.messages.length - 1];
                    const timeAgo = (() => {
                      const diff = Date.now() - new Date(ticket.updatedAt || ticket.createdAt).getTime();
                      const mins = Math.floor(diff / 60000);
                      if (mins < 1) return 'just now';
                      if (mins < 60) return `${mins}m`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `${hrs}h`;
                      return `${Math.floor(hrs / 24)}d`;
                    })();

                    return (
                      <div 
                        key={ticket._id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`ticket-card px-4 py-3.5 cursor-pointer relative border-b border-outline-variant/20 ${
                          isActive ? 'active bg-primary/[0.04]' : 'hover:bg-surface-container-low/50'
                        }`}
                      >
                        {/* Active indicator bar */}
                        {isActive && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />}
                        
                        <div className="flex gap-3">
                          {/* Author avatar */}
                          <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold mt-0.5 ${
                            isActive ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
                          }`}>
                            {ticket.author?.name?.charAt(0) || '?'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-[12px] font-semibold text-on-surface truncate">{ticket.author?.name}</span>
                              <span className="text-[10px] text-outline shrink-0">{timeAgo}</span>
                            </div>
                            <h3 className="text-[13px] font-medium text-on-surface truncate leading-snug">{ticket.subject}</h3>
                            {lastMsg && (
                              <p className="text-[11px] text-on-surface-variant/60 truncate mt-0.5 leading-snug">
                                {lastMsg.message?.substring(0, 60)}{lastMsg.message?.length > 60 ? '...' : ''}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className={`${priorityClass} px-2 py-[1px] rounded-full text-[9px] font-bold uppercase tracking-wide`}>
                                {ticket.priority}
                              </span>
                              <span className="flex items-center gap-1">
                                {ticket.status === 'Open' && <span className="w-1.5 h-1.5 rounded-full bg-error status-dot-open" />}
                                <span className={`text-[9px] font-semibold uppercase tracking-wide ${
                                  ticket.status === 'Open' ? 'text-error' : 'text-on-surface-variant/50'
                                }`}>{ticket.status}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredTickets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                      <span className="material-symbols-outlined text-[40px] text-outline-variant/40 mb-3">inbox</span>
                      <p className="text-[13px] text-on-surface-variant/50">No tickets match your search</p>
                    </div>
                  )}
                </div>

                {/* Resize handle */}
                <div 
                  onMouseDown={startResizeQueue}
                  className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-primary/30 z-30 transition-colors active:bg-primary/60"
                />
              </section>

              {/* Right Pane: Workspace */}
              <section className="flex-1 flex flex-col bg-background relative">
                {selectedTicket ? (
                  <>
                    {/* Premium Glassmorphism Header */}
                    <header className="header-glass h-[72px] shrink-0 border-b border-outline-variant/30 flex items-center px-6 sticky top-0 z-30 justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Author avatar in header */}
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 shadow-sm">
                          <span className="text-on-surface-variant text-sm font-bold">{selectedTicket.author?.name?.charAt(0) || '?'}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h2 className="text-[15px] font-semibold text-on-surface truncate max-w-[350px] md:max-w-[450px]">{selectedTicket.subject}</h2>
                            <span className="bg-surface-container-high text-on-surface-variant/70 px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0">#{selectedTicket._id.slice(-6).toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[12px] text-on-surface-variant/60">{selectedTicket.author?.name}</span>
                            {selectedTicket.book && (
                              <>
                                <span className="w-0.5 h-0.5 rounded-full bg-outline" />
                                <span className="text-[12px] text-on-surface-variant/60 italic">{selectedTicket.book.title}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status controls */}
                      <div className="flex items-center gap-2">
                        {/* Priority Capsule */}
                        <div className="relative">
                          <button 
                            onClick={() => { setPriorityOpen(!priorityOpen); setStatusOpen(false); }}
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
                                    onClick={() => { updateTicket({ priority: p }); setPriorityOpen(false); }}
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
                            onClick={() => { setStatusOpen(!statusOpen); setPriorityOpen(false); }}
                            className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition-all"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedTicket.status === 'Open' ? 'bg-error' : selectedTicket.status === 'Resolved' ? 'bg-green-500' : 'bg-primary'}`} />
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
                                    onClick={() => { updateTicket({ status: s }); setStatusOpen(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${selectedTicket.status === s ? 'bg-primary/5 text-primary' : 'text-on-surface hover:bg-surface-container-low'}`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </header>

                    {/* Conversation Area with subtle pattern */}
                    <div className="flex-1 overflow-y-auto chat-bg-pattern custom-scrollbar pb-[200px] px-6 pt-6 flex flex-col">
                      {selectedTicket.messages.map((msg: any, idx: number) => {
                        const prevMsg = idx > 0 ? selectedTicket.messages[idx - 1] : null;
                        const prevSenderId = prevMsg ? (typeof prevMsg.sender === 'object' ? prevMsg.sender?._id : prevMsg.sender) : null;
                        const currentSenderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
                        const isSameSender = prevMsg && (prevSenderId === currentSenderId) && (prevMsg.isInternal === msg.isInternal);
                        
                        const msgSenderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
                        const loggedInUserId = user?.id || user?._id;
                        const isAdmin = msg.sender?.role === 'admin' || (msgSenderId && loggedInUserId && msgSenderId.toString() === loggedInUserId.toString());

                        const timeStr = new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                        return msg.isInternal ? (
                          <div key={idx} className={`flex justify-end msg-internal ${isSameSender ? 'mt-1' : 'mt-5'}`}>
                            <div className="flex items-end gap-2 max-w-[70%]">
                              <div className={`bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 text-amber-900 px-4 py-2.5 shadow-sm ${
                                isSameSender ? 'rounded-2xl rounded-br-lg' : 'rounded-2xl rounded-br-sm'
                              }`}>
                                <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-amber-200/50">
                                  <span className="material-symbols-outlined text-amber-600 text-[14px]">lock</span>
                                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Internal Note</span>
                                </div>
                                <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                <span className="text-[10px] text-amber-600/60 mt-1.5 block text-right font-mono">{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        ) : isAdmin ? (
                          <div key={idx} className={`flex justify-end msg-admin ${isSameSender ? 'mt-1' : 'mt-5'}`}>
                            <div className="flex items-end gap-2 max-w-[70%]">
                              <div className={`bg-primary text-white px-4 py-2.5 shadow-sm ${
                                isSameSender ? 'rounded-2xl rounded-br-lg' : 'rounded-2xl rounded-br-sm'
                              }`}>
                                <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                <span className="text-[10px] text-white/50 mt-1.5 block text-right font-mono">{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={idx} className={`flex justify-start msg-author ${isSameSender ? 'mt-1' : 'mt-5'}`}>
                            <div className="flex items-end gap-2 max-w-[70%]">
                              {!isSameSender ? (
                                <div className="w-7 h-7 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center shadow-sm mb-0.5">
                                  <span className="text-[10px] font-bold text-on-surface-variant">{msg.sender?.name?.charAt(0) || '?'}</span>
                                </div>
                              ) : (
                                <div className="w-7 shrink-0" />
                              )}
                              <div className={`bg-white border border-outline-variant/20 text-on-surface px-4 py-2.5 shadow-sm ${
                                isSameSender ? 'rounded-2xl rounded-bl-lg' : 'rounded-2xl rounded-bl-sm'
                              }`}>
                                {!isSameSender && (
                                  <p className="text-[10px] font-semibold text-primary mb-1">{msg.sender?.name || 'Author'}</p>
                                )}
                                <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                <span className="text-[10px] text-on-surface-variant/40 mt-1.5 block font-mono">{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div className="h-6" />
                    </div>

                    {/* Premium Floating Composer */}
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
                            {/* Resize handle */}
                            {isExpanded && (
                              <div 
                                onMouseDown={startResizeReply}
                                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-outline-variant/40 rounded-full cursor-row-resize hover:bg-primary/40 transition-colors"
                                title="Drag to resize"
                              />
                            )}

                            {/* Textarea */}
                            <textarea 
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              style={{ height: isExpanded ? `${replyHeight}px` : '24px' }}
                              className={`w-full bg-transparent border-none focus:ring-0 resize-none outline-none custom-scrollbar transition-colors duration-200 text-[14px] ${
                                isExpanded ? 'text-on-surface' : 'text-on-surface leading-6'
                              }`}
                              placeholder={isInternal && isExpanded ? "Write a private internal note..." : `Message ${selectedTicket.author?.name || 'author'}...`}
                            />

                            {/* Unified Footer Actions (expanded only) */}
                            {isExpanded && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between pt-3 mt-2 border-t border-outline-variant/20 select-none"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Left Actions */}
                                  <div className="flex items-center gap-1 border-r border-outline-variant/20 pr-3">
                                    <input 
                                      type="file" 
                                      id="file-upload" 
                                      className="hidden" 
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          alert(`File "${e.target.files[0].name}" selected. (Cloud storage uploads are coming soon!)`);
                                        }
                                      }}
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => document.getElementById('file-upload')?.click()}
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
                                        className="flex items-center"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                      </motion.span>
                                      {isDrafting ? 'Generating...' : 'AI Draft'}
                                    </motion.button>
                                  </div>
                                  
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                      type="checkbox" 
                                      checked={isInternal}
                                      onChange={(e) => setIsInternal(e.target.checked)}
                                      className="w-3.5 h-3.5 text-primary border-outline-variant rounded focus:ring-primary cursor-pointer"
                                    />
                                    <span className="text-[11px] text-on-surface-variant/60 group-hover:text-on-surface-variant transition-colors">Internal note</span>
                                  </label>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Right Actions */}
                                  <button 
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setReplyMessage(''); 
                                      setIsInternal(false);
                                      setIsFocused(false);
                                    }} 
                                    className="px-3 py-1.5 text-[11px] font-medium text-on-surface-variant hover:text-error rounded-lg hover:bg-error/5 transition-all cursor-pointer"
                                  >
                                    Discard
                                  </button>
                                  <button 
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateTicket({ new_message: replyMessage, is_internal: isInternal });
                                      setIsFocused(false);
                                    }}
                                    disabled={!replyMessage.trim()}
                                    className="bg-primary text-white px-4 py-1.5 rounded-lg text-[11px] font-semibold shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100 flex items-center gap-1.5 cursor-pointer"
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
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-[32px] text-outline-variant">forum</span>
                    </div>
                    <p className="text-[15px] font-medium text-on-surface/80">Select a conversation</p>
                    <p className="text-[12px] text-on-surface-variant/50 mt-1 max-w-[240px]">Choose a ticket from the inbox to view the conversation and respond</p>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {/* 2. Manuscripts Dashboard View */}
          {activeTab === 'manuscripts' && (
            <motion.div 
              key="manuscripts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-background"
            >
              {/* Header */}
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-[20px] font-semibold text-on-surface">Manuscripts</h2>
                  <p className="text-[12px] text-on-surface-variant/60 mt-0.5">Review, track, and approve author book manuscripts</p>
                </div>
                <div className="bg-surface-container-high rounded-lg px-4 py-2 text-[12px] font-semibold text-on-surface-variant">
                  {books.length} manuscripts
                </div>
              </div>

              {/* Manuscripts Table */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse select-none">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-on-surface-variant/60 text-[10px] font-semibold uppercase tracking-[0.1em]">
                        <th className="py-3 px-5 font-semibold">Book Title</th>
                        <th className="py-3 px-5 font-semibold">Author</th>
                        <th className="py-3 px-5 font-semibold">Genre</th>
                        <th className="py-3 px-5 font-semibold">MRP</th>
                        <th className="py-3 px-5 font-semibold">Royalty/Copy</th>
                        <th className="py-3 px-5 font-semibold">Status</th>
                        <th className="py-3 px-5 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant font-body-sm text-on-surface">
                      {books.map(book => (
                        <tr key={book._id} className="hover:bg-surface-container-high/40 transition-colors">
                          <td className="py-4 px-6 font-semibold text-primary">{book.title}</td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="font-bold">{book.author?.name}</span>
                              <span className="text-[11px] text-on-surface-variant">{book.author?.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-surface-container px-3 py-1 rounded-full text-secondary font-label-md text-xs">
                              {book.genre || 'General'}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-medium">Rs. {book.mrp || 0}</td>
                          <td className="py-4 px-6 font-medium">Rs. {book.author_royalty_per_copy || 0}</td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full font-label-md text-xs font-bold ${
                              book.status === 'Published' 
                                ? 'bg-primary-container text-on-primary-container' 
                                : book.status === 'Under Review'
                                ? 'bg-secondary-fixed text-on-secondary-fixed'
                                : 'bg-surface-container-highest text-secondary'
                            }`}>
                              {book.status || 'Draft'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {book.status !== 'Published' ? (
                              <button 
                                onClick={() => updateBookStatus(book._id, 'Published')}
                                disabled={isActionLoading === book._id}
                                className="bg-primary text-on-primary hover:brightness-110 disabled:opacity-50 px-4 py-2 rounded-full font-label-md text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                              >
                                {isActionLoading === book._id ? 'Publishing...' : 'Approve & Publish'}
                              </button>
                            ) : (
                              <span className="text-secondary font-label-md text-xs flex items-center justify-end gap-1 font-bold">
                                <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                                Published
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {books.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-on-surface-variant opacity-60 font-body-md">
                            No manuscripts found in the database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. Royalties Dashboard View */}
          {activeTab === 'royalties' && (
            <motion.div 
              key="royalties"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-background"
            >
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-[20px] font-semibold text-on-surface">Royalties</h2>
                <p className="text-[12px] text-on-surface-variant/60 mt-0.5">Monitor sales data, evaluate metrics, and disburse payouts</p>
              </div>

              {/* Financial Metrics Cards (Wow Factor!) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: 'auto_stories', label: 'Copies Sold', value: books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0).toLocaleString(), suffix: 'units', color: 'bg-primary/10 text-primary' },
                  { icon: 'account_balance_wallet', label: 'Total Earned', value: `₹${books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0).toLocaleString()}`, color: 'bg-primary/10 text-primary' },
                  { icon: 'payments', label: 'Total Paid', value: `₹${books.reduce((acc, b) => acc + (b.royalty_paid || 0), 0).toLocaleString()}`, color: 'bg-green-50 text-green-700' },
                  { icon: 'hourglass_empty', label: 'Pending', value: `₹${books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0).toLocaleString()}`, color: 'bg-amber-50 text-amber-700' },
                ].map(metric => (
                  <div key={metric.label} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 flex items-center gap-4 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl ${metric.color} flex items-center justify-center shrink-0`}>
                      <span className="material-symbols-outlined text-[20px]">{metric.icon}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.1em]">{metric.label}</p>
                      <h3 className="text-[18px] font-bold text-white mt-0.5 leading-tight">
                        {metric.value} {metric.suffix && <span className="text-[11px] text-neutral-500 font-normal">{metric.suffix}</span>}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Royalties Table */}
              <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse select-none">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-on-surface-variant/60 text-[10px] font-semibold uppercase tracking-[0.1em]">
                        <th className="py-3 px-5 font-semibold">Book Details</th>
                        <th className="py-3 px-5 font-semibold">Copies Sold</th>
                        <th className="py-3 px-5 font-semibold">Royalty Earned</th>
                        <th className="py-3 px-5 font-semibold text-green-700">Paid</th>
                        <th className="py-3 px-5 font-semibold text-amber-700">Pending</th>
                        <th className="py-3 px-5 font-semibold">Last Payout</th>
                        <th className="py-3 px-5 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant font-body-sm text-on-surface">
                      {books.map(book => (
                        <tr key={book._id} className="hover:bg-surface-container-high/40 transition-colors">
                          <td className="py-4 px-6 font-semibold text-primary">
                            <div className="flex flex-col">
                              <span className="font-bold text-primary">{book.title}</span>
                              <span className="text-[11px] text-on-surface-variant font-normal">Author: {book.author?.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium">{book.total_copies_sold || 0}</td>
                          <td className="py-4 px-6 font-medium">Rs. {book.total_royalty_earned || 0}</td>
                          <td className="py-4 px-6 text-green-700 font-semibold">Rs. {book.royalty_paid || 0}</td>
                          <td className="py-4 px-6 text-amber-700 font-semibold">Rs. {book.royalty_pending || 0}</td>
                          <td className="py-4 px-6 text-on-surface-variant">
                            {book.last_royalty_payout_date 
                              ? new Date(book.last_royalty_payout_date).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {book.royalty_pending > 0 ? (
                              <button 
                                onClick={() => payRoyalties(book._id)}
                                disabled={isActionLoading === book._id}
                                className="bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 px-4 py-2 rounded-full font-label-md text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                              >
                                {isActionLoading === book._id ? 'Paying...' : `Pay Payout`}
                              </button>
                            ) : (
                              <span className="text-green-700 font-label-md text-xs flex items-center justify-end gap-1 font-bold">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Paid Up
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {books.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-on-surface-variant opacity-60 font-body-md">
                            No books available to calculate royalties.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
