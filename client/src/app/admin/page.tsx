"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken, getUser, logout } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    const currentUser = getUser();
    if (!token || !currentUser || currentUser.role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchTickets(token);

    const interval = setInterval(() => {
      fetchTickets(token);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchTickets = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/tickets`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        // Update selected ticket data if it's open
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-600 text-white animate-pulse';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  if (!user) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white shadow">
        <div className="mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Admin: {user.name}</span>
            <button onClick={logout} className="text-sm text-gray-300 hover:text-white">Logout</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane - Ticket Queue */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-700">Ticket Queue</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tickets.map(ticket => (
              <div 
                key={ticket._id} 
                onClick={() => setSelectedTicket(ticket)}
                className={\`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors 
                  \${selectedTicket?._id === ticket._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}\`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={\`text-xs px-2 py-0.5 rounded font-medium \${getPriorityColor(ticket.priority)}\`}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm truncate">{ticket.subject}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-600 truncate">{ticket.author?.name}</span>
                  <span className={\`text-xs font-semibold \${ticket.status === 'Open' ? 'text-red-600' : 'text-green-600'}\`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane - Ticket Details */}
        <div className="w-2/3 bg-gray-50 flex flex-col">
          {selectedTicket ? (
            <>
              <div className="p-6 bg-white shadow-sm border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTicket.subject}</h2>
                    <p className="text-sm text-gray-500 mt-1">From: {selectedTicket.author?.name} ({selectedTicket.author?.email})</p>
                    {selectedTicket.book && (
                      <p className="text-sm text-blue-600 font-medium mt-1">Book: {selectedTicket.book.title}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={selectedTicket.status}
                      onChange={(e) => updateTicket({ status: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 font-medium"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                    <select 
                      value={selectedTicket.priority}
                      onChange={(e) => updateTicket({ priority: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 font-medium"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
                <div className="text-sm text-gray-600">Category: <span className="font-semibold">{selectedTicket.category}</span></div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedTicket.messages.map((msg: any, idx: number) => (
                  <div key={idx} className={\`p-4 rounded-lg text-sm max-w-[80%] \${msg.isInternal ? 'bg-yellow-100 border border-yellow-300 ml-auto' : msg.sender._id === user.id ? 'bg-blue-100 ml-auto' : 'bg-white border border-gray-200'}\`}>
                    <div className="font-semibold text-xs mb-1 text-gray-700 flex justify-between">
                      <span>{msg.sender.name} {msg.isInternal && '(Internal Note)'}</span>
                      <span className="text-gray-500 font-normal ml-4">{new Date(msg.createdAt || Date.now()).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-gray-800">{msg.message}</p>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1 text-sm text-gray-700">
                      <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                      Internal Note
                    </label>
                  </div>
                  <button 
                    onClick={generateDraft}
                    disabled={isDrafting}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    ✨ {isDrafting ? 'Drafting...' : 'AI Draft Response'}
                  </button>
                </div>
                <textarea 
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full border border-gray-300 rounded p-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                />
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={() => updateTicket({ new_message: replyMessage, is_internal: isInternal })}
                    disabled={!replyMessage.trim()}
                    className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-sm font-medium disabled:opacity-50"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a ticket to view details
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
