"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken, getUser, logout } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';

// Import Modular Components
import AdminSidebar from '@/components/admin/AdminSidebar';
import TicketQueue from '@/components/admin/TicketQueue';
import ChatWorkspace from '@/components/admin/ChatWorkspace';
import ManuscriptsTable from '@/components/admin/ManuscriptsTable';
import RoyaltiesDashboard from '@/components/admin/RoyaltiesDashboard';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Navigation & Sizing State
  const [activeTab, setActiveTab] = useState<'messages' | 'manuscripts' | 'royalties'>('messages');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [queueWidth, setQueueWidth] = useState(380);
  const [isResizingQueue, setIsResizingQueue] = useState(false);

  // Data States
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Fetch Tickets
  const fetchTickets = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/tickets`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        // Refresh selected ticket context in real-time
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

  // Fetch Administrators
  const fetchAdmins = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/admins`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setAdmins(await res.json());
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
    
    // Initial fetches
    fetchTickets(token);
    fetchBooks(token);
    fetchAdmins(token);

    // Polling every 5 seconds for real-time updates
    const interval = setInterval(() => {
      const currentDynamicUser = getUser();
      if (!currentDynamicUser || currentDynamicUser.role !== 'admin' || currentDynamicUser.id !== currentUser.id) {
        clearInterval(interval);
        window.location.href = '/login?reason=session_overwrite';
        return;
      }
      const currentToken = getAuthToken() as string;
      fetchTickets(currentToken);
      fetchBooks(currentToken);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Resize queue drawer handlers
  const startResizeQueue = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingQueue(true);
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

  // Patch ticket updates (status, priority, assigned_admin, new_message, is_internal)
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
      } else {
        alert('Failed to update ticket');
      }
    } catch (e) {
      alert('Failed to update ticket');
    }
  };

  // Publish manuscript status update
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

  // Pay royalties execution
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

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-on-surface font-body-md">
      
      {/* 1. Premium Dark Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        logout={logout}
        openTicketsCount={tickets.filter(t => t.status === 'Open').length}
      />

      {/* 2. Main Content Split Pane */}
      <main className="flex-1 flex overflow-hidden">
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
              {/* Ticket Queue list */}
              <TicketQueue
                tickets={tickets}
                selectedTicket={selectedTicket}
                setSelectedTicket={setSelectedTicket}
                queueWidth={queueWidth}
                startResizeQueue={startResizeQueue}
              />

              {/* ChatWorkspace detail workspace */}
              <ChatWorkspace
                selectedTicket={selectedTicket}
                admins={admins}
                user={user}
                onUpdateTicket={updateTicket}
              />
            </motion.div>
          )}

          {activeTab === 'manuscripts' && (
            <motion.div 
              key="manuscripts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex overflow-hidden"
            >
              <ManuscriptsTable
                books={books}
                isActionLoading={isActionLoading}
                updateBookStatus={updateBookStatus}
              />
            </motion.div>
          )}

          {activeTab === 'royalties' && (
            <motion.div 
              key="royalties"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex overflow-hidden"
            >
              <RoyaltiesDashboard
                books={books}
                isActionLoading={isActionLoading}
                payRoyalties={payRoyalties}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
