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
      if (res.ok) {
        const data = await res.json();
        if (data.draft) setReplyMessage(data.draft);
      } else {
        alert('Failed to generate draft');
      }
    } catch (e) {
      alert('Failed to generate draft');
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
      
      {/* 1. Retractable Sidebar using Framer Motion */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 280 : 84 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="flex flex-col h-full py-md px-sm border-r border-outline-variant bg-surface-container-low shrink-0 z-40 relative select-none"
      >
        {/* Brand/Logo Section (Toggles Sidebar) */}
        <div 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="px-sm mb-lg flex items-center gap-3 cursor-pointer group"
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <motion.img 
            whileHover={{ scale: 1.08, rotate: [0, -10, 10, 0] }}
            alt="BookLeaf Brand Logo" 
            className="w-10 h-10 rounded-lg shadow-md" 
            src="/logo.png"
          />
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1"
            >
              <h1 className="font-headline-md text-headline-md font-bold text-primary">BookLeaf</h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">Admin Portal</p>
            </motion.div>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-2">
          {/* Messages (Standard Ticket Queue) */}
          <div 
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-sm px-sm py-3 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-surface-container-lowest text-primary border-l-4 border-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            {sidebarOpen && <span className="font-label-md text-label-md">Messages</span>}
          </div>

          {/* Manuscripts Dashboard */}
          <div 
            onClick={() => setActiveTab('manuscripts')}
            className={`flex items-center gap-sm px-sm py-3 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'manuscripts'
                ? 'bg-surface-container-lowest text-primary border-l-4 border-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">menu_book</span>
            {sidebarOpen && <span className="font-label-md text-label-md">Manuscripts</span>}
          </div>

          {/* Royalties Dashboard */}
          <div 
            onClick={() => setActiveTab('royalties')}
            className={`flex items-center gap-sm px-sm py-3 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === 'royalties'
                ? 'bg-surface-container-lowest text-primary border-l-4 border-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined">payments</span>
            {sidebarOpen && <span className="font-label-md text-label-md">Royalties</span>}
          </div>
        </nav>

        {/* Bottom Panel Logout */}
        <div className="mt-auto">
          <button 
            onClick={logout} 
            className="w-full bg-surface-container-high text-on-surface-variant py-3 rounded-xl font-label-md hover:brightness-95 hover:text-error transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {sidebarOpen && <span>Logout</span>}
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
              
              {/* Left Pane: Ticket Queue (With Custom Width Resizer) */}
              <section 
                style={{ width: `${queueWidth}px` }}
                className="min-w-[300px] max-w-[600px] border-r border-outline-variant bg-surface-container-lowest flex flex-col z-20 shrink-0 relative"
              >
                {/* Search & Filters */}
                <div className="p-md space-y-sm bg-surface-container-lowest z-10 shadow-sm">
                  {/* Search box with inline search SVG (Fixed text overlap) */}
                  <div className="relative">
                    <div className="absolute left-sm top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-on-surface-variant">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                    <input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-sm py-sm bg-surface-container-low border border-outline-variant rounded-full font-body-sm focus:outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary shadow-inner" 
                      placeholder="Search author tickets..." 
                      type="text"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">All Tickets ({filteredTickets.length})</span>
                    <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">filter_list</span>
                  </div>
                </div>

                {/* Scrollable Queue */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {filteredTickets.map(ticket => (
                    <div 
                      key={ticket._id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-md border-b border-outline-variant transition-all cursor-pointer group relative ${
                        selectedTicket?._id === ticket._id 
                          ? 'bg-primary-fixed/20 border-l-4 border-primary shadow-inner' 
                          : 'hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`${getPriorityClasses(ticket.priority)} px-2 py-0.5 rounded font-label-md text-[10px] uppercase flex items-center gap-1`}>
                          {ticket.priority === 'Critical' && <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>}
                          {ticket.priority}
                        </span>
                        <span className="font-label-md text-[11px] text-on-surface-variant">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-body-md font-bold text-primary truncate">{ticket.subject}</h3>
                      <div className="mt-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline text-[16px]">person</span>
                          <span className="font-label-md text-on-surface-variant truncate w-32">{ticket.author?.name}</span>
                        </div>
                        <span className={`font-label-md text-label-sm ${ticket.status === 'Open' ? 'text-error font-bold' : 'text-primary font-bold'}`}>{ticket.status}</span>
                      </div>
                    </div>
                  ))}
                  {filteredTickets.length === 0 && (
                    <div className="p-8 text-center text-on-surface-variant opacity-60 font-body-sm">
                      No tickets match your search query
                    </div>
                  )}
                </div>

                {/* Custom Split Pane drag border */}
                <div 
                  onMouseDown={startResizeQueue}
                  className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize hover:bg-primary/40 z-30 transition-all active:bg-primary"
                />
              </section>

              {/* Right Pane: Workspace */}
              <section className="flex-1 flex flex-col bg-background relative">
                {selectedTicket ? (
                  <>
                    {/* Workspace Header */}
                    <header className="h-20 shrink-0 border-b border-outline-variant flex items-center px-margin bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-30 justify-between">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-sm min-w-0">
                          <h2 className="font-headline-md text-headline-md text-primary truncate max-w-[450px] md:max-w-[550px]">{selectedTicket.subject}</h2>
                          <span className="bg-primary-fixed text-on-primary-fixed-variant px-sm py-1 rounded-full font-label-md text-[10px]">#{selectedTicket._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-base mt-1">
                          <span className="font-body-sm text-on-surface-variant">Author: <strong>{selectedTicket.author?.name}</strong></span>
                          {selectedTicket.book && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                              <span className="font-body-sm text-on-surface-variant">Book: <em>{selectedTicket.book.title}</em></span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Dropdown selectors styled as Custom Capsules with Framer Motion animations */}
                      <div className="flex items-center gap-md">
                        {/* Priority Selector Capsule */}
                        <div className="flex flex-col items-end relative">
                          <label className="font-label-md text-[9px] uppercase tracking-wider text-on-surface-variant mb-1">Priority</label>
                          <button 
                            onClick={() => { setPriorityOpen(!priorityOpen); setStatusOpen(false); }}
                            className="bg-surface-container-low border border-outline-variant hover:border-primary rounded-full px-4 py-1 text-primary font-label-md flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedTicket.priority === 'Critical' ? 'bg-error pulse-critical' : 'bg-primary'}`}></span>
                            <span>{selectedTicket.priority}</span>
                            <svg className={`w-3.5 h-3.5 transition-transform text-outline duration-200 ${priorityOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          <AnimatePresence>
                            {priorityOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 4, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                className="absolute right-0 top-[48px] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-1.5 z-50 min-w-[130px]"
                              >
                                {['Critical', 'High', 'Medium', 'Low'].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => {
                                      updateTicket({ priority: p });
                                      setPriorityOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-surface-container-high rounded-xl font-label-md transition-colors text-on-surface hover:text-primary"
                                  >
                                    {p}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Status Selector Capsule */}
                        <div className="flex flex-col items-end relative">
                          <label className="font-label-md text-[9px] uppercase tracking-wider text-on-surface-variant mb-1">Status</label>
                          <button 
                            onClick={() => { setStatusOpen(!statusOpen); setPriorityOpen(false); }}
                            className="bg-surface-container-high border border-outline-variant hover:border-primary rounded-full px-4 py-1 text-secondary font-label-md flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <span>{selectedTicket.status}</span>
                            <svg className={`w-3.5 h-3.5 transition-transform text-outline duration-200 ${statusOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          <AnimatePresence>
                            {statusOpen && (
                              <motion.div 
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 4, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                className="absolute right-0 top-[48px] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl p-1.5 z-50 min-w-[130px]"
                              >
                                {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
                                  <button
                                    key={s}
                                    onClick={() => {
                                      updateTicket({ status: s });
                                      setStatusOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-surface-container-high rounded-xl font-label-md transition-colors text-on-surface hover:text-primary"
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

                    {/* Conversation area scroll list with padding at the bottom to avoid being hidden behind hovering input */}
                    <div className="flex-1 overflow-y-auto p-margin custom-scrollbar pb-[280px] flex flex-col">
                      {selectedTicket.messages.map((msg: any, idx: number) => {
                        const prevMsg = idx > 0 ? selectedTicket.messages[idx - 1] : null;
                        const prevSenderId = prevMsg ? (prevMsg.sender._id || prevMsg.sender) : null;
                        const currentSenderId = msg.sender._id || msg.sender;
                        const isSameSender = prevMsg && (prevSenderId === currentSenderId) && (prevMsg.isInternal === msg.isInternal);
                        
                        return msg.isInternal ? (
                          <div key={idx} className={`flex justify-center ${isSameSender ? 'mt-1' : 'mt-4'}`}>
                            <div className="bg-primary-fixed/30 border border-primary-fixed-dim p-sm rounded-lg flex items-center gap-sm max-w-xl shadow-sm">
                              <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                              <p className="font-body-sm text-on-primary-fixed-variant whitespace-pre-wrap">
                                <strong>Internal Note:</strong> {msg.message}
                              </p>
                              <span className="font-label-md text-[11px] text-primary/60 whitespace-nowrap ml-4">
                                {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          </div>
                        ) : msg.sender._id === user.id || msg.sender === user.id ? (
                          <div key={idx} className={`flex flex-row-reverse gap-md max-w-3xl ml-auto animate-fade-in w-full ${isSameSender ? 'mt-1' : 'mt-4'}`}>
                            {!isSameSender ? (
                              <div className="w-10 h-10 rounded-full bg-primary overflow-hidden shrink-0 flex items-center justify-center shadow-md select-none">
                                <span className="text-on-primary font-bold">{msg.sender.name ? msg.sender.name.charAt(0) : 'A'}</span>
                              </div>
                            ) : (
                              <div className="w-10 shrink-0 select-none" />
                            )}
                            <div className={`bg-primary-container text-on-primary p-md rounded-2xl shadow-sm max-w-[80%] ${isSameSender ? 'rounded-tr-2xl' : 'rounded-tr-none'}`}>
                              <p className="font-body-md whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                              <span className="font-label-md text-[11px] text-on-primary-container mt-2 block opacity-70">
                                {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div key={idx} className={`flex gap-md max-w-3xl animate-fade-in w-full ${isSameSender ? 'mt-1' : 'mt-4'}`}>
                            {!isSameSender ? (
                              <div className="w-10 h-10 rounded-full bg-surface-dim overflow-hidden shrink-0 flex items-center justify-center shadow-sm select-none">
                                <span className="material-symbols-outlined text-outline">person</span>
                              </div>
                            ) : (
                              <div className="w-10 shrink-0 select-none" />
                            )}
                            <div className={`bg-surface-container-high p-md rounded-2xl shadow-sm max-w-[80%] ${isSameSender ? 'rounded-tl-2xl' : 'rounded-tl-none'}`}>
                              <p className="font-body-md text-on-surface whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                              <span className="font-label-md text-[11px] text-on-surface-variant mt-2 block">
                                {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="h-10"></div>
                    </div>

                    {/* Floating Reply Area over the chat list */}
                    <div className="absolute bottom-6 left-6 right-6 z-30 pointer-events-none">
                      {(() => {
                        const isExpanded = isFocused || replyMessage.trim() !== '';
                        return (
                          <motion.div 
                            layout
                            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                            style={{
                              borderRadius: isExpanded ? '24px' : '9999px',
                            }}
                            className={`max-w-4xl mx-auto bg-surface-container-lowest/95 backdrop-blur-lg border border-outline-variant/60 shadow-2xl pointer-events-auto relative flex flex-col ${
                              isExpanded ? 'p-4' : 'p-2.5 px-6'
                            }`}
                          >
                            {/* Height resizing bar at top (Only when expanded) */}
                            {isExpanded && (
                              <div 
                                onMouseDown={startResizeReply}
                                className="absolute -top-1 left-0 right-0 h-[6px] cursor-row-resize hover:bg-primary/30 z-30 transition-colors flex items-center justify-center rounded-t-3xl"
                                title="Drag to resize typing field"
                              >
                                <div className="w-12 h-1 bg-outline-variant/60 rounded-full"></div>
                              </div>
                            )}

                            {/* Custom Height adjustable card container */}
                            <motion.div 
                              layout
                              className={`transition-all duration-300 flex flex-col ${
                                isExpanded 
                                  ? 'border rounded-2xl p-3 bg-surface-bright border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-sm' 
                                  : 'border-none bg-transparent'
                              } ${
                                isInternal && isExpanded ? 'bg-primary-fixed/10 border-primary-fixed-dim' : ''
                              }`}
                            >
                              <textarea 
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                style={{ height: isExpanded ? `${replyHeight}px` : '32px' }}
                                className={`w-full font-body-md bg-transparent border-none focus:ring-0 resize-none outline-none custom-scrollbar transition-all duration-300 ${
                                  isExpanded ? 'p-0 text-on-surface' : 'p-0 text-on-surface select-all leading-normal flex items-center justify-center'
                                }`}
                                placeholder={isInternal && isExpanded ? "Write a private note for staff..." : `Type your message to ${selectedTicket.author?.name}...`}
                              ></textarea>

                              {/* Action Toolbar Inside Text Box Card (Only when expanded) */}
                              {isExpanded && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="flex items-center justify-between pt-2 border-t border-outline-variant/30 mt-2 select-none"
                                >
                                  <div className="flex items-center gap-sm">
                                    {/* Attach File Button */}
                                    <button 
                                      type="button" 
                                      className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant flex items-center justify-center cursor-pointer"
                                      title="Attach files"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                      </svg>
                                    </button>

                                    {/* AI Assist Capsule Button */}
                                    <motion.button 
                                      onMouseDown={(e) => e.preventDefault()} // prevent blur on click
                                      onClick={generateDraft}
                                      disabled={isDrafting}
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      style={{
                                        background: 'linear-gradient(135deg, #a73645 0%, #6366f1 50%, #d946ef 100%)',
                                        color: '#ffffff',
                                      }}
                                      className="ai-glow text-white px-4 py-1.5 rounded-full font-label-md flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-70 disabled:pointer-events-none text-xs border border-white/20"
                                    >
                                      <motion.span 
                                        animate={isDrafting ? { rotate: 360 } : { rotate: [0, 15, -15, 0] }}
                                        transition={isDrafting ? { repeat: Infinity, duration: 1, ease: "linear" } : { repeat: Infinity, duration: 2, repeatDelay: 1.5 }}
                                        className="flex items-center"
                                      >
                                        <span className="material-symbols-outlined text-[16px] text-white">auto_awesome</span>
                                      </motion.span>
                                      <span>{isDrafting ? 'Drafting...' : 'AI Assist'}</span>
                                    </motion.button>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                            
                            {/* Footer Controls (Only when expanded) */}
                            {isExpanded && (
                              <motion.footer 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center justify-between select-none mt-3"
                              >
                                <div className="flex items-center gap-sm cursor-pointer group">
                                  <input 
                                    type="checkbox" 
                                    checked={isInternal}
                                    onChange={(e) => setIsInternal(e.target.checked)}
                                    id="internal-note" 
                                    className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary cursor-pointer"
                                  />
                                  <label htmlFor="internal-note" className="font-body-sm text-on-surface-variant cursor-pointer group-hover:text-primary transition-colors">Mark as Internal Note</label>
                                </div>

                                <div className="flex items-center gap-md">
                                  {/* Improved Capsule Discard Button */}
                                  <button 
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setReplyMessage(''); 
                                      setIsInternal(false);
                                      setIsFocused(false);
                                    }} 
                                    className="px-5 py-2 font-label-md text-primary border border-outline-variant hover:bg-error-container/20 hover:text-error hover:border-error-container rounded-full transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Discard
                                  </button>

                                  {/* Improved Capsule Send Message Button */}
                                  <button 
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateTicket({ new_message: replyMessage, is_internal: isInternal });
                                      setIsFocused(false);
                                    }}
                                    disabled={!replyMessage.trim()}
                                    className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md shadow-md hover:shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>Send Message</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                  </button>
                                </div>
                              </motion.footer>
                            )}
                          </motion.div>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant opacity-70">
                    <span className="material-symbols-outlined text-[64px] mb-4 text-outline-variant">forum</span>
                    <p className="font-headline-md text-headline-md">Select a ticket to begin</p>
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
              className="flex-1 overflow-y-auto p-margin custom-scrollbar bg-background flex flex-col"
            >
              {/* Header */}
              <div className="mb-lg flex justify-between items-center">
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold">Manuscripts Dashboard</h2>
                  <p className="font-body-sm text-on-surface-variant mt-1">Review, track, and approve author book manuscripts</p>
                </div>
                <div className="bg-surface-container-high rounded-full px-5 py-2 font-label-md text-primary font-bold shadow-sm">
                  Total Manuscripts: {books.length}
                </div>
              </div>

              {/* Manuscripts Grid / Table */}
              <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse select-none">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-md text-xs uppercase tracking-wider">
                        <th className="py-4 px-6">Book Title</th>
                        <th className="py-4 px-6">Author</th>
                        <th className="py-4 px-6">Genre</th>
                        <th className="py-4 px-6">MRP</th>
                        <th className="py-4 px-6">Royalty/Copy</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
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
              className="flex-1 overflow-y-auto p-margin custom-scrollbar bg-background flex flex-col"
            >
              {/* Header */}
              <div className="mb-lg">
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Royalties Dashboard</h2>
                <p className="font-body-sm text-on-surface-variant mt-1">Monitor sales data, evaluate royalties metrics, and disburse payouts</p>
              </div>

              {/* Financial Metrics Cards (Wow Factor!) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-lg">
                {/* Metric 1 */}
                <div className="bg-surface-container rounded-3xl p-lg border border-outline-variant shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined">auto_stories</span>
                  </div>
                  <div>
                    <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Sold</p>
                    <h3 className="font-headline-md text-headline-md font-bold text-primary mt-1">
                      {books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0).toLocaleString()} <span className="text-xs text-secondary font-normal">copies</span>
                    </h3>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-surface-container rounded-3xl p-lg border border-outline-variant shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                  </div>
                  <div>
                    <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Earned</p>
                    <h3 className="font-headline-md text-headline-md font-bold text-primary mt-1">
                      Rs. {books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0).toLocaleString()}
                    </h3>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-surface-container rounded-3xl p-lg border border-outline-variant shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Paid</p>
                    <h3 className="font-headline-md text-headline-md font-bold text-green-700 mt-1">
                      Rs. {books.reduce((acc, b) => acc + (b.royalty_paid || 0), 0).toLocaleString()}
                    </h3>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-surface-container rounded-3xl p-lg border border-outline-variant shadow-sm flex items-center gap-4 relative overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined">hourglass_empty</span>
                  </div>
                  <div>
                    <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Pending</p>
                    <h3 className="font-headline-md text-headline-md font-bold text-amber-700 mt-1">
                      Rs. {books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0).toLocaleString()}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Royalties Table */}
              <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse select-none">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-md text-xs uppercase tracking-wider">
                        <th className="py-4 px-6">Book Details</th>
                        <th className="py-4 px-6">Copies Sold</th>
                        <th className="py-4 px-6">Royalty Earned</th>
                        <th className="py-4 px-6 text-green-700">Royalty Paid</th>
                        <th className="py-4 px-6 text-amber-700">Royalty Pending</th>
                        <th className="py-4 px-6">Last Payout Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
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
