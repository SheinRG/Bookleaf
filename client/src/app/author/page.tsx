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

  // Ticket replies state
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState<Record<string, boolean>>({});

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
        alert('Ticket submitted successfully');
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
      
      {/* 1. Retractable Sidebar using Framer Motion */}
      <motion.aside 
        animate={{ width: sidebarOpen ? 280 : 84 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="hidden md:flex flex-col h-screen py-unit px-unit border-r border-outline-variant bg-surface-container shrink-0 z-50 sticky top-0 select-none"
      >
        {/* Logo and Collapsing Switch */}
        <div 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-3 px-unit mb-8 cursor-pointer group"
          title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <motion.img 
            whileHover={{ scale: 1.08, rotate: [0, -10, 10, 0] }}
            alt="BookLeaf Logo" 
            className="h-10 w-10 rounded-lg shadow-md" 
            src="/logo.png" 
          />
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1"
            >
              <h1 className="font-headline-md text-headline-md font-bold text-primary">BookLeaf</h1>
              <p className="font-label-md text-label-md text-on-surface-variant">Author Portal</p>
            </motion.div>
          )}
        </div>

        {/* Clean-cut Navigation (Removed redundant dead links) */}
        <nav className="flex-1 space-y-2">
          {/* Dashboard Tab */}
          <div 
            onClick={() => scrollToSection('dashboard-top')}
            className="flex items-center gap-unit px-unit py-3 rounded-xl transition-all duration-200 bg-surface-container-lowest text-primary border-l-4 border-primary shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined">dashboard</span>
            {sidebarOpen && <span className="font-label-md text-label-md">Dashboard</span>}
          </div>

          {/* Support Tab */}
          <div 
            onClick={() => scrollToSection('support-section')}
            className="flex items-center gap-unit px-unit py-3 rounded-xl transition-all hover:bg-surface-container-high text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined">contact_support</span>
            {sidebarOpen && <span className="font-label-md text-label-md">Support Query</span>}
          </div>
        </nav>

        {/* Bottom panel Logout */}
        <div className="mt-auto border-t border-outline-variant pt-4">
          <button 
            onClick={logout}
            className="w-full bg-surface-container-high text-on-surface-variant py-3 rounded-xl font-label-md hover:brightness-95 hover:text-error transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0" id="dashboard-top">
        {/* TopNavBar */}
        <header className="flex justify-between items-center px-8 h-16 w-full sticky top-0 z-40 bg-surface-container-lowest shadow-sm border-b border-outline-variant">
          <div className="flex items-center gap-4">
            <h2 className="font-body-md text-body-md text-on-surface-variant">Welcome, <span className="font-semibold text-primary">{user.name}</span></h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary-container transition-all" placeholder="Search manuscripts..." type="text"/>
            </div>
            <button onClick={logout} className="flex items-center gap-1 px-4 py-2 rounded-full border border-outline hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="font-label-md text-label-md">Logout</span>
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
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-full text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span className="font-label-md text-label-md">Export CSV</span>
                </button>
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
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant">Associated Book</label>
                    <select 
                      value={selectedBook}
                      onChange={(e) => setSelectedBook(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary-container outline-none bg-background transition-all"
                    >
                      <option value="">Other / General Query</option>
                      {books.map(b => (
                        <option key={b._id} value={b._id}>{b.title}</option>
                      ))}
                    </select>
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
                          <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            {(() => {
                              const visibleMessages = ticket.messages.filter((m: any) => !m.isInternal);
                              return visibleMessages.map((msg: any, idx: number) => {
                                const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
                                const prevSenderId = prevMsg ? (prevMsg.sender._id || prevMsg.sender) : null;
                                const currentSenderId = msg.sender._id || msg.sender;
                                const isSameSender = prevMsg && (prevSenderId === currentSenderId);
                                const isSelf = msg.sender === user.id || msg.sender._id === user.id;

                                return (
                                  <div 
                                    key={idx} 
                                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm flex flex-col ${
                                      isSelf 
                                        ? 'self-end bg-primary text-on-primary' 
                                        : 'self-start bg-surface-container-lowest text-on-surface border border-outline-variant/30'
                                    } ${
                                      isSameSender ? 'mt-1' : 'mt-4'
                                    } ${
                                      isSelf 
                                        ? (isSameSender ? 'rounded-tr-2xl' : 'rounded-tr-none') 
                                        : (isSameSender ? 'rounded-tl-2xl' : 'rounded-tl-none')
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                    <span className={`block text-[9px] mt-1.5 font-mono ${isSelf ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                                      {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleString()}
                                    </span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          
                          {/* Live Interactive Chat Input for Authors! */}
                          {ticket.status !== 'Resolved' && (
                            <div className="pt-2 flex gap-2 select-none">
                              <input 
                                value={ticketReplies[ticket._id] || ''}
                                onChange={(e) => setTicketReplies(prev => ({ ...prev, [ticket._id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') sendReply(ticket._id);
                                }}
                                className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary shadow-inner" 
                                placeholder="Type a reply..." 
                                type="text"
                              />
                              <button 
                                onClick={() => sendReply(ticket._id)}
                                disabled={isReplying[ticket._id] || !ticketReplies[ticket._id]?.trim()}
                                className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center transition-all hover:brightness-110 disabled:opacity-50 active:scale-90 shadow-md cursor-pointer shrink-0"
                              >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                              </button>
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
        
        <footer className="p-8 border-t border-outline-variant mt-8 select-none">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-label-md text-label-sm text-on-surface-variant">© 2024 BookLeaf Publishing Portal. All rights reserved.</p>
            <div className="flex gap-6">
              <a className="font-label-md text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="font-label-md text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
              <a className="font-label-md text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Admin</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
