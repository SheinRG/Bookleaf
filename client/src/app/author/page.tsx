"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken, getUser, logout } from '@/lib/api';
import Image from 'next/image';

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [openTickets, setOpenTickets] = useState<Record<string, boolean>>({});
  
  // Ticket form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const toggleTicket = (id: string) => {
    setOpenTickets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden">
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col h-full py-unit px-unit border-r border-outline-variant bg-surface-container fixed left-0 top-0 w-[280px] z-50">
        <div className="flex items-center gap-unit px-unit mb-8">
          <img alt="BookLeaf Logo" className="h-10 w-10 rounded-lg" src="/logo.png" />
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary">BookLeaf</h1>
            <p className="font-label-md text-label-md text-on-surface-variant">Author Portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-unit px-unit py-3 rounded-lg transition-all duration-200 bg-surface-container-lowest text-primary border-l-4 border-primary" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-label-md">Dashboard</span>
          </a>
          <a className="flex items-center gap-unit px-unit py-3 rounded-lg transition-all hover:bg-surface-container-high text-on-surface-variant" href="#">
            <span className="material-symbols-outlined">menu_book</span>
            <span className="font-label-md text-label-md">Manuscripts</span>
          </a>
          <a className="flex items-center gap-unit px-unit py-3 rounded-lg transition-all hover:bg-surface-container-high text-on-surface-variant" href="#">
            <span className="material-symbols-outlined">payments</span>
            <span className="font-label-md text-label-md">Royalties</span>
          </a>
          <a className="flex items-center gap-unit px-unit py-3 rounded-lg transition-all hover:bg-surface-container-high text-on-surface-variant" href="#">
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="font-label-md text-label-md">Messages</span>
          </a>
          <a className="flex items-center gap-unit px-unit py-3 rounded-lg transition-all hover:bg-surface-container-high text-on-surface-variant" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md text-label-md">Settings</span>
          </a>
        </nav>
        <div className="mt-auto border-t border-outline-variant pt-unit">
          <a className="flex items-center gap-unit px-unit py-3 rounded-lg transition-all hover:bg-surface-container-high text-on-surface-variant" href="#">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-md text-label-md">Help Center</span>
          </a>
          <button className="w-full mt-2 bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all">
            New Project
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-[280px]">
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

        <div className="p-8 space-y-8">
          {/* Section A: Royalty & Books Dashboard */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline-md text-headline-md text-primary">Performance Overview</h3>
                <p className="font-label-md text-on-surface-variant">Track your publications and earnings in real-time.</p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span className="font-label-md text-label-md">Export CSV</span>
                </button>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-xl custom-shadow border border-outline-variant overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-4 font-label-md text-label-md uppercase tracking-wider">Book Title &amp; ISBN</th>
                      <th className="px-4 py-4 font-label-md text-label-md uppercase tracking-wider">Status</th>
                      <th className="px-4 py-4 font-label-md text-label-md uppercase tracking-wider text-right">MRP</th>
                      <th className="px-4 py-4 font-label-md text-label-md uppercase tracking-wider text-right">Copies Sold</th>
                      <th className="px-4 py-4 font-label-md text-label-md uppercase tracking-wider text-right">Total Earned</th>
                      <th className="px-4 py-4 font-label-md text-label-md uppercase tracking-wider text-right">Paid</th>
                      <th className="px-4 py-4 font-label-md text-label-md uppercase tracking-wider text-right bg-primary-container/10">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {books.map(book => (
                      <tr key={book._id} className="hover:bg-background transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-body-md font-semibold text-primary">{book.title}</div>
                          <div className="text-xs text-on-surface-variant font-mono">{book.isbn}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${book.status.includes('Live') ? 'bg-primary-container/20 text-on-primary-fixed-variant' : 'bg-surface-container-high text-on-surface-variant'}`}>
                            {book.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium">₹{book.mrp || '-'}</td>
                        <td className="px-4 py-4 text-right text-sm font-medium">{book.total_copies_sold}</td>
                        <td className="px-4 py-4 text-right text-sm font-medium">₹{book.total_royalty_earned}</td>
                        <td className="px-4 py-4 text-right text-sm font-medium">₹{book.royalty_paid}</td>
                        <td className="px-4 py-4 text-right font-semibold text-primary bg-primary-container/5">₹{book.royalty_pending}</td>
                      </tr>
                    ))}
                    {books.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500">No books found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section B: Support & Communication */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Submit Query Form */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">contact_support</span>
                <h3 className="font-headline-md text-headline-md text-primary">Submit Query</h3>
              </div>
              <div className="bg-surface-container-lowest rounded-xl custom-shadow border border-outline-variant p-6">
                <form className="space-y-4" onSubmit={submitTicket}>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant">Associated Book</label>
                    <select 
                      value={selectedBook}
                      onChange={(e) => setSelectedBook(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary-container outline-none bg-background transition-all"
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
                      className="w-full px-4 py-2 rounded-lg border border-outline-variant focus:ring-2 focus:ring-primary-container outline-none bg-background transition-all" 
                      placeholder="e.g., Royalty mismatch query" 
                      type="text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-label-md text-on-surface-variant">Description</label>
                    <div className="border border-outline-variant rounded-lg overflow-hidden">
                      <div className="bg-surface-container px-4 py-1.5 border-b border-outline-variant flex gap-3">
                        <button className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary" type="button">format_bold</button>
                        <button className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary" type="button">format_italic</button>
                        <button className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary" type="button">link</button>
                        <button className="material-symbols-outlined text-[20px] text-on-surface-variant hover:text-primary" type="button">attach_file</button>
                      </div>
                      <textarea 
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 border-none focus:ring-0 outline-none bg-background resize-none" 
                        placeholder="Describe your issue in detail..." 
                        rows={6}
                      ></textarea>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: My Tickets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">confirmation_number</span>
                  <h3 className="font-headline-md text-headline-md text-primary">My Tickets</h3>
                </div>
                <span className="font-label-md text-label-md bg-primary-container/20 text-on-primary-fixed-variant px-2.5 py-0.5 rounded-full">{tickets.length} Total</span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {tickets.map(ticket => (
                  <div key={ticket._id} className={`bg-surface-container-lowest rounded-xl custom-shadow border border-outline-variant overflow-hidden ${ticket.status === 'Resolved' ? 'opacity-80' : ''}`}>
                    <button 
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-background transition-colors" 
                      onClick={() => toggleTicket(ticket._id)}
                    >
                      <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          ticket.status === 'Open' ? 'bg-error-container/40' :
                          ticket.status === 'Resolved' ? 'bg-surface-container-high' :
                          'bg-primary-container/10'
                        }`}>
                          <span className={`material-symbols-outlined ${
                            ticket.status === 'Open' ? 'text-error' :
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
                            <span className={`font-label-md text-label-sm uppercase tracking-wider ${
                              ticket.status === 'Open' ? 'text-error' :
                              ticket.status === 'Resolved' ? 'text-on-surface-variant' :
                              'text-primary'
                            }`}>
                              {ticket.status}
                            </span>
                            <span className="text-[4px] bg-outline rounded-full h-1 w-1"></span>
                            <span className="font-label-md text-label-sm text-on-surface-variant">Ref: #{ticket._id.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: openTickets[ticket._id] ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
                    </button>
                    
                    {openTickets[ticket._id] && (
                      <div className="border-t border-outline-variant bg-surface-container-low p-4 space-y-4">
                        <div className="flex flex-col gap-3">
                          {ticket.messages.filter((m: any) => !m.isInternal).map((msg: any, idx: number) => (
                            <div key={idx} className={`max-w-[80%] rounded-2xl p-3 ${
                              msg.sender === user.id 
                                ? 'self-end bg-primary-container text-on-primary-container rounded-tr-none' 
                                : 'self-start bg-surface-container rounded-tl-none'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <span className={`block text-[10px] mt-1 ${msg.sender === user.id ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}>
                                {new Date(msg.timestamp || Date.now()).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                        {ticket.status !== 'Resolved' && (
                          <div className="pt-2 flex gap-2">
                            <input className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-full px-4 text-sm outline-none focus:ring-2 focus:ring-primary-container" placeholder="Type a reply..." type="text"/>
                            <button className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"><span className="material-symbols-outlined text-[18px]">send</span></button>
                          </div>
                        )}
                        {ticket.status === 'Resolved' && (
                          <p className="text-sm text-on-surface-variant italic text-center">This ticket is resolved.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {tickets.length === 0 && (
                  <p className="text-gray-500 text-sm">You haven't submitted any tickets yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
        
        <footer className="p-8 border-t border-outline-variant mt-8">
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
