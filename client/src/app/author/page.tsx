"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken, getUser, logout } from '@/lib/api';

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  
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

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Author Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user.name}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Books Section */}
        <section className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800">My Books</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {books.map(book => (
                  <tr key={book._id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{book.title}
                      <div className="text-xs text-gray-500">{book.isbn}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className={`px-2 py-1 text-xs rounded-full ${book.status.includes('Live') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {book.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">₹{book.mrp || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{book.total_copies_sold}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">₹{book.total_royalty_earned}</td>
                    <td className="px-4 py-3 text-sm text-green-600">₹{book.royalty_paid}</td>
                    <td className="px-4 py-3 text-sm text-red-600">₹{book.royalty_pending}</td>
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
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submit Ticket Form */}
          <section className="lg:col-span-1 bg-white p-6 shadow rounded-lg h-fit">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Submit a Query</h2>
            <form onSubmit={submitTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Related Book</label>
                <select 
                  value={selectedBook}
                  onChange={(e) => setSelectedBook(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="">General / Account Level</option>
                  {books.map(b => (
                    <option key={b._id} value={b._id}>{b.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input 
                  type="text" 
                  required 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  required 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Attachment (Optional UI only)</label>
                <input type="file" className="mt-1 block w-full text-sm text-gray-500" />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:bg-blue-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </section>

          {/* Tickets List */}
          <section className="lg:col-span-2 bg-white p-6 shadow rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800">My Tickets</h2>
            <div className="space-y-4">
              {tickets.map(ticket => (
                <div key={ticket._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(ticket.createdAt).toLocaleString()} 
                        {ticket.book && ` • Book: ${ticket.book.title}`}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                      ${ticket.status === 'Open' ? 'bg-red-100 text-red-800' : 
                        ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                    {ticket.messages.filter((m: any) => !m.isInternal).map((msg: any, idx: number) => (
                      <div key={idx} className={`p-3 rounded-md text-sm ${msg.sender === user.id ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                        <div className="font-semibold text-xs mb-1 text-gray-700">
                          {msg.sender === user.id ? 'You' : 'BookLeaf Support'}
                        </div>
                        <p className="whitespace-pre-wrap text-gray-800">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="text-gray-500 text-sm">You haven't submitted any tickets yet.</p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
