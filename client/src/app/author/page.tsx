"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken, getUser, logout } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

// Import Modular Components
import BooksTable from '@/components/author/BooksTable';
import SubmitTicketForm from '@/components/author/SubmitTicketForm';
import AuthorTicketList from '@/components/author/AuthorTicketList';

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  
  // Sidebar open/close state
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      const currentDynamicUser = getUser();
      if (!currentDynamicUser || currentDynamicUser.role !== 'author' || currentDynamicUser.id !== currentUser.id) {
        clearInterval(interval);
        window.location.href = '/login?reason=session_overwrite';
        return;
      }
      fetchTickets(getAuthToken() as string);
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

  const handleRefresh = () => {
    const token = getAuthToken();
    if (token) fetchTickets(token);
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
          <BooksTable books={books} />

          {/* Section B: Support & Communication */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="support-section">
            {/* Left Column: Submit Query Form */}
            <SubmitTicketForm 
              books={books} 
              onSubmitSuccess={handleRefresh} 
              setShowSuccessPopup={setShowSuccessPopup}
            />

            {/* Right Column: My Tickets */}
            <AuthorTicketList 
              tickets={tickets} 
              user={user} 
              onReplySuccess={handleRefresh} 
            />
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
