"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken, getUser, logout } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [openTickets, setOpenTickets] = useState<Record<string, boolean>>({});
  
  // Sidebar open/close state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Ticket form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState<Record<string, boolean>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    const currentUser = getUser();
    if (!token || !currentUser || currentUser.role !== 'author') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchData(token);

    // Polling every 5 seconds for tickets
    const interval = setInterval(() => {
      fetchTickets(token);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const [booksRes, ticketsRes] = await Promise.all([
        fetch(`${API_URL}/books`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/tickets`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (booksRes.ok) setBooks(await booksRes.json());
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTickets = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/tickets`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setTickets(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject,
          description,
          book_id: selectedBook || undefined
        })
      });
      if (res.ok) {
        setSubject('');
        setDescription('');
        setSelectedBook('');
        fetchTickets(token as string);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      }
    } catch (e) {
      alert('Failed to submit ticket');
    }
    setIsSubmitting(false);
  };

  // Reply to ticket (real interactive functionality)
  const sendReply = async (ticketId: string) => {
    const replyText = ticketReplies[ticketId];
    if (!replyText || !replyText.trim()) return;

    setIsReplying(prev => ({ ...prev, [ticketId]: true }));
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          new_message: replyText,
          is_internal: false
        })
      });
      if (res.ok) {
        setTicketReplies(prev => ({ ...prev, [ticketId]: '' }));
        fetchTickets(token as string);
      } else {
        alert('Failed to send reply');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReplying(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const toggleTicket = (id: string) => {
    setOpenTickets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden">
      
      {/* 1. Retractable Premium Sidebar */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-gradient-to-b from-[#1c1b1b] to-[#2a2123] border-r border-[#3a2f31] text-white/90 hidden md:flex flex-col h-screen py-5 px-3 shrink-0 z-50 sticky top-0 select-none overflow-hidden"
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
                <p className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium">Author Portal</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 mt-4">
          <div 
            onClick={() => scrollToSection('dashboard-top')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 bg-[#3a2a2e] text-white shadow-sm cursor-pointer relative group overflow-hidden"
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
            <span className="material-symbols-outlined text-[20px] mb-0.5 text-primary">dashboard</span>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-semibold text-[13px] ml-1 overflow-hidden whitespace-nowrap"
                >
                  Dashboard
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* User Profile / Logout */}
        <div className="mt-auto border-t border-white/10 pt-4">
          <div 
            onClick={logout}
            className="flex items-center gap-3 px-2 py-2 rounded-xl transition-all hover:bg-error/10 text-white/70 hover:text-error cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-error/20 flex items-center justify-center shrink-0 transition-colors">
              <span className="font-bold text-[11px] text-white/90 group-hover:text-error">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <p className="text-[13px] font-semibold text-white/90 truncate group-hover:text-error transition-colors">{user?.name || 'Author'}</p>
                  <p className="text-[10px] text-white/40 truncate group-hover:text-error/70 transition-colors">Sign out</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0" id="dashboard-top">
        {/* TopNavBar */}
        <header className="flex justify-between items-center px-8 h-16 w-full sticky top-0 z-40 header-glass shadow-sm border-b border-outline-variant/50">
          <div className="flex items-center gap-4">
            <h2 className="text-[16px] text-on-surface-variant font-medium tracking-tight">Welcome back, <span className="font-bold text-on-surface">{user.name}</span></h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={logout} className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container-high hover:text-error transition-colors active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8 flex-1">
          {/* Section A: Royalty & Books Dashboard */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline-md text-headline-md text-primary font-bold">Performance Overview</h3>
                <p className="font-label-md text-on-surface-variant mt-1">Track your publications and earnings in real-time.</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse select-none">
                  <thead className="bg-surface-container text-on-surface-variant font-label-md text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Book Title &amp; ISBN</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">MRP</th>
                      <th className="px-6 py-4 text-right">Copies Sold</th>
                      <th className="px-6 py-4 text-right">Total Earned</th>
                      <th className="px-6 py-4 text-right">Paid</th>
                      <th className="px-6 py-4 text-right bg-primary-container/10">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant font-body-sm text-on-surface">
                    {books.map(book => (
                      <tr key={book._id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-primary">{book.title}</div>
                          <div className="text-xs text-on-surface-variant font-mono mt-0.5">{book.isbn || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${book.status === 'Published' ? 'bg-primary-container/20 text-on-primary-fixed-variant' : 'bg-surface-container-high text-on-surface-variant'}`}>
                            {book.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">₹{book.mrp || '-'}</td>
                        <td className="px-6 py-4 text-right font-medium">{book.total_copies_sold}</td>
                        <td className="px-6 py-4 text-right font-medium">₹{book.total_royalty_earned}</td>
                        <td className="px-6 py-4 text-right font-medium">₹{book.royalty_paid}</td>
                        <td className="px-6 py-4 text-right font-bold text-primary bg-primary-container/5">₹{book.royalty_pending}</td>
                      </tr>
                    ))}
                    {books.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant opacity-60 font-body-md">No manuscripts or royalties found for your account.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section B: Support & Communication */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="support-section">
            
            {/* Left Column: Submit Query Form */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">contact_support</span>
                <h3 className="font-headline-md text-headline-md text-primary font-bold">Submit Query</h3>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
                <form className="space-y-4" onSubmit={submitTicket}>
                  <div className="space-y-1 relative">
                    <label className="font-label-md text-label-md text-on-surface-variant">Associated Book</label>
                    <div 
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-background cursor-pointer flex justify-between items-center hover:border-primary/50 transition-colors"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className={selectedBook ? "text-on-surface" : "text-on-surface-variant"}>
                        {selectedBook ? (books.find(b => b._id === selectedBook)?.title || 'Other / General Query') : 'Other / General Query'}
                      </span>
                      <span className={`material-symbols-outlined transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>
                    
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute w-full mt-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-lg z-50 overflow-hidden"
                        >
                          <div 
                            className="px-4 py-2.5 hover:bg-surface-container-low cursor-pointer transition-colors border-b border-outline-variant/20 text-on-surface"
                            onClick={() => { setSelectedBook(''); setIsDropdownOpen(false); }}
                          >
                            Other / General Query
                          </div>
                          {books.map(b => (
                            <div 
                              key={b._id}
                              className="px-4 py-2.5 hover:bg-surface-container-low cursor-pointer transition-colors border-b border-outline-variant/20 last:border-none text-on-surface"
                              onClick={() => { setSelectedBook(b._id); setIsDropdownOpen(false); }}
                            >
                              {b.title}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant">Subject</label>
                    <input 
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary-container outline-none bg-background transition-all" 
                      placeholder="e.g., Royalty mismatch query" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant">Description</label>
                    <div className="border border-outline-variant rounded-xl overflow-hidden shadow-inner bg-background focus-within:border-primary transition-colors">
                      <textarea 
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 border-none focus:ring-0 outline-none bg-transparent resize-none custom-scrollbar font-body-md" 
                        placeholder="Describe your issue in detail..." 
                        rows={6}
                      ></textarea>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-on-primary py-3 rounded-full font-semibold hover:shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: My Tickets (Fully Functional Real-Time Chat!) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">confirmation_number</span>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">My Tickets</h3>
                </div>
                <span className="font-label-md text-xs font-bold bg-primary-container/20 text-on-primary-fixed-variant px-3 py-1 rounded-full shadow-sm">{tickets.length} Total</span>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {tickets.map(ticket => (
                  <div key={ticket._id} className={`bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm transition-all duration-200 ${ticket.status === 'Resolved' ? 'opacity-80' : ''}`}>
                    <button 
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-background transition-colors cursor-pointer select-none" 
                      onClick={() => toggleTicket(ticket._id)}
                    >
                      <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
                          ticket.status === 'Open' ? 'bg-error-container/40' :
                          ticket.status === 'Resolved' ? 'bg-surface-container-high' :
                          'bg-primary-container/10'
                        }`}>
                          <span className={`material-symbols-outlined ${
                            ticket.status === 'Open' ? 'text-error animate-pulse' :
                            ticket.status === 'Resolved' ? 'text-outline' :
                            'text-primary'
                          }`}>
                            {ticket.status === 'Open' ? 'priority_high' :
                             ticket.status === 'Resolved' ? 'done_all' : 'forum'}
                          </span>
                        </div>
                        <div>
                          <div className="font-body-md font-bold text-on-surface">{ticket.subject}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`font-label-md text-xs font-bold uppercase tracking-wider ${
                              ticket.status === 'Open' ? 'text-error' :
                              ticket.status === 'Resolved' ? 'text-on-surface-variant' :
                              'text-primary'
                            }`}>
                              {ticket.status}
                            </span>
                            <span className="text-[4px] bg-outline rounded-full h-1 w-1"></span>
                            <span className="font-label-md text-xs text-on-surface-variant">Ref: #{ticket._id.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: openTickets[ticket._id] ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                    </button>
                    
                    <AnimatePresence>
                      {openTickets[ticket._id] && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-outline-variant bg-surface-container-low p-4 space-y-4"
                        >
                          <div className="flex flex-col max-h-[350px] overflow-y-auto chat-bg-pattern p-4 space-y-2 rounded-xl mb-4 border border-outline-variant/30 shadow-inner">
                            {(() => {
                              const visibleMessages = ticket.messages.filter((m: any) => !m.isInternal);
                              return visibleMessages.map((msg: any, idx: number) => {
                                const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
                                const prevSenderId = prevMsg ? (typeof prevMsg.sender === 'object' ? prevMsg.sender?._id : prevMsg.sender) : null;
                                const currentSenderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
                                const isSameSender = prevMsg && (prevSenderId === currentSenderId);
                                
                                const msgSenderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
                                const loggedInUserId = user?.id || user?._id;
                                const isSelf = msg.sender?.role === 'author' || (msgSenderId && loggedInUserId && msgSenderId.toString() === loggedInUserId.toString());
                                const timeStr = new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                                return isSelf ? (
                                  <div key={idx} className={`flex justify-end msg-author ${isSameSender ? 'mt-1' : 'mt-5'}`}>
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
                                  <div key={idx} className={`flex justify-start msg-admin ${isSameSender ? 'mt-1' : 'mt-5'}`}>
                                    <div className="flex items-end gap-2 max-w-[70%]">
                                      {!isSameSender ? (
                                        <div className="w-7 h-7 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center shadow-sm mb-0.5">
                                          <span className="text-[10px] font-bold text-on-surface-variant">
                                            {msg.sender?.name?.charAt(0) || 'A'}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="w-7 shrink-0" />
                                      )}
                                      <div className={`bg-white border border-outline-variant/20 text-on-surface px-4 py-2.5 shadow-sm ${
                                        isSameSender ? 'rounded-2xl rounded-bl-lg' : 'rounded-2xl rounded-bl-sm'
                                      }`}>
                                        {!isSameSender && (
                                          <p className="text-[10px] font-semibold text-primary mb-1">{msg.sender?.name || 'Support'}</p>
                                        )}
                                        <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                        <span className="text-[10px] text-on-surface-variant/40 mt-1.5 block font-mono">{timeStr}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          
                          {/* Live Interactive Chat Input for Authors! */}
                          {ticket.status !== 'Resolved' && (
                            <div className="flex flex-col bg-white border border-outline-variant/60 shadow-sm rounded-2xl p-2 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                              <textarea 
                                value={ticketReplies[ticket._id] || ''}
                                onChange={(e) => setTicketReplies(prev => ({ ...prev, [ticket._id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendReply(ticket._id);
                                  }
                                }}
                                className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none custom-scrollbar text-[14px] text-on-surface px-3 py-2" 
                                placeholder="Write a reply..." 
                                rows={2}
                              />
                              <div className="flex justify-between items-center px-2 pt-2 border-t border-outline-variant/20">
                                <button className="p-1.5 hover:bg-surface-container-low rounded-lg transition-colors text-outline flex items-center justify-center cursor-pointer">
                                  <span className="material-symbols-outlined text-[18px]">attach_file</span>
                                </button>
                                <button 
                                  onClick={() => sendReply(ticket._id)}
                                  disabled={isReplying[ticket._id] || !ticketReplies[ticket._id]?.trim()}
                                  className="bg-primary text-white px-4 py-1.5 rounded-lg text-[11px] font-semibold shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>Send</span>
                                  <span className="material-symbols-outlined text-[14px]">send</span>
                                </button>
                              </div>
                            </div>
                          )}
                          {ticket.status === 'Resolved' && (
                            <p className="text-sm text-on-surface-variant italic text-center font-bold">This ticket is resolved.</p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {tickets.length === 0 && (
                  <p className="text-on-surface-variant opacity-60 text-sm italic">You haven't submitted any tickets yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
        
        {/* Success Popup */}
        <AnimatePresence>
          {showSuccessPopup && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-8 right-8 bg-surface-container-lowest border border-outline-variant shadow-2xl rounded-2xl p-4 flex items-center gap-4 z-50 pointer-events-none"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-700 text-[24px]">check_circle</span>
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-[15px]">Ticket Submitted!</h4>
                <p className="text-on-surface-variant text-[13px] mt-0.5">We've received your query.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
