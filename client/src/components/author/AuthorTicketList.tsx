"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL, getAuthToken } from '@/lib/api';

interface AuthorTicketListProps {
  tickets: any[];
  user: any;
  onReplySuccess: () => void;
}

export default function AuthorTicketList({ tickets, user, onReplySuccess }: AuthorTicketListProps) {
  const [openTickets, setOpenTickets] = useState<Record<string, boolean>>({});
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState<Record<string, boolean>>({});

  const toggleTicket = (id: string) => {
    setOpenTickets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isClosedOrResolved = (status: string) => status === 'Resolved' || status === 'Closed';

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onReplySuccess();
      } else {
        const text = await res.text();
        let msg = 'Failed to delete ticket.';
        try {
          const data = JSON.parse(text);
          msg = data.error || msg;
        } catch (_) {
          msg = text || msg;
        }
        alert(`Error ${res.status}: ${msg}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Network error: ${e}`);
    }
  };

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
        onReplySuccess();
      } else {
        alert('Failed to send reply');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReplying(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  return (
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
          <div key={ticket._id} className={`bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm transition-all duration-200 ${isClosedOrResolved(ticket.status) ? 'opacity-80' : ''}`}>
            <button 
              className="w-full text-left p-4 flex items-center justify-between hover:bg-background transition-colors cursor-pointer select-none" 
              onClick={() => toggleTicket(ticket._id)}
            >
              <div className="flex gap-4 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
                  ticket.status === 'Open' ? 'bg-error-container/40' :
                  isClosedOrResolved(ticket.status) ? 'bg-surface-container-high' :
                  'bg-primary-container/10'
                }`}>
                  <span className={`material-symbols-outlined ${
                    ticket.status === 'Open' ? 'text-error animate-pulse' :
                    isClosedOrResolved(ticket.status) ? 'text-outline' :
                    'text-primary'
                  }`}>
                    {ticket.status === 'Open' ? 'priority_high' :
                     isClosedOrResolved(ticket.status) ? 'done_all' : 'forum'}
                  </span>
                </div>
                <div>
                  <div className="font-body-md font-bold text-on-surface">{ticket.subject}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-label-md text-xs font-bold uppercase tracking-wider ${
                      ticket.status === 'Open' ? 'text-error' :
                      isClosedOrResolved(ticket.status) ? 'text-green-600' :
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
                        const isSelf = msg.sender?.role === 'author' || (msgSenderId && (ticket.author?._id || ticket.author)?.toString() === msgSenderId.toString());
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
                  
                  {!isClosedOrResolved(ticket.status) && (
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
                        <button 
                          type="button"
                          onClick={() => {
                            alert("Attachments UI placeholder selected. Actual uploads can be done in our cloud storage.");
                          }}
                          className="p-1.5 hover:bg-surface-container-low rounded-lg transition-colors text-outline flex items-center justify-center cursor-pointer"
                        >
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
                  {isClosedOrResolved(ticket.status) && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-green-600 italic text-center font-bold flex-1">
                        This ticket is {ticket.status.toLowerCase()}.
                      </p>
                      <button
                        onClick={() => handleDeleteTicket(ticket._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-error hover:bg-error/5 border border-error/30 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        Delete
                      </button>
                    </div>
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
  );
}
