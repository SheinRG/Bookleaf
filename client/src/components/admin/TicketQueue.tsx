"use client";

import React, { useState } from 'react';

interface TicketQueueProps {
  tickets: any[];
  selectedTicket: any;
  setSelectedTicket: (ticket: any) => void;
  queueWidth: number;
  startResizeQueue: (e: React.MouseEvent) => void;
}

type PriorityType = 'Critical' | 'High' | 'Medium' | 'Low';
type StatusType = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
type CategoryType = 
  | 'Royalty & Payments' 
  | 'ISBN & Metadata Issues' 
  | 'Printing & Quality' 
  | 'Distribution & Availability' 
  | 'Book Status & Production Updates' 
  | 'General Inquiry';

export default function TicketQueue({
  tickets,
  selectedTicket,
  setSelectedTicket,
  queueWidth,
  startResizeQueue
}: TicketQueueProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Capsule Filter States
  const [selectedStatus, setSelectedStatus] = useState<StatusType | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<PriorityType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('newest');

  // Toggle Filters
  const handleStatusToggle = (status: StatusType) => {
    setSelectedStatus(prev => prev === status ? null : status);
  };

  const handlePriorityToggle = (priority: PriorityType) => {
    setSelectedPriority(prev => prev === priority ? null : priority);
  };

  const handleCategoryToggle = (category: CategoryType) => {
    setSelectedCategory(prev => prev === category ? null : category);
  };

  const clearAllFilters = () => {
    setSelectedStatus(null);
    setSelectedPriority(null);
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-50 text-red-700 border border-red-200';
      case 'High': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'Medium': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Low': return 'bg-neutral-100 text-neutral-600 border border-neutral-200';
      default: return 'bg-neutral-100 text-neutral-600 border border-neutral-200';
    }
  };

  // Perform client-side filtering
  let filteredTickets = tickets.filter(ticket => {
    // 1. Text Search matching
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchLower) ||
      ticket.author?.name.toLowerCase().includes(searchLower) ||
      ticket._id.toLowerCase().includes(searchLower);

    // 2. Status Capsule Filter
    const matchesStatus = !selectedStatus || ticket.status === selectedStatus;

    // 3. Priority Capsule Filter
    const matchesPriority = !selectedPriority || ticket.priority === selectedPriority;

    // 4. Category Capsule Filter
    const matchesCategory = !selectedCategory || ticket.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Client-side date sorting overrides if user changes toggle
  if (sortOrder === 'oldest') {
    filteredTickets = [...filteredTickets].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sortOrder === 'newest') {
    filteredTickets = [...filteredTickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <section 
      style={{ width: `${queueWidth}px` }}
      className="min-w-[300px] max-w-[650px] border-r border-outline-variant/50 bg-white flex flex-col z-20 shrink-0 relative"
    >
      {/* Queue Header & Filters */}
      <div className="queue-header p-4 pb-3 space-y-3 z-10 border-b border-outline-variant/30 bg-white">
        
        {/* Search Input */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </div>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low/60 border-none rounded-xl text-[13px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline text-on-surface" 
            placeholder="Search tickets..." 
            type="text"
          />
        </div>

        {/* Capsule Toggle Filters Bar (Gorgeous custom UI requested by the user!) */}
        <div className="space-y-2 pt-1 select-none">
          {/* Status Capsules */}
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase mr-1 w-10">Status</span>
            {(['Open', 'In Progress', 'Resolved', 'Closed'] as StatusType[]).map(status => {
              const isActive = selectedStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-primary border-primary text-white shadow-sm font-bold scale-[1.03]' 
                      : 'bg-surface-container border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>

          {/* Priority Capsules */}
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase mr-1 w-10">Priority</span>
            {(['Critical', 'High', 'Medium', 'Low'] as PriorityType[]).map(priority => {
              const isActive = selectedPriority === priority;
              return (
                <button
                  key={priority}
                  onClick={() => handlePriorityToggle(priority)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-primary border-primary text-white shadow-sm font-bold scale-[1.03]' 
                      : 'bg-surface-container border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {priority}
                </button>
              );
            })}
          </div>

          {/* Sort order toggle and Clear all */}
          <div className="flex justify-between items-center pt-1 border-t border-outline-variant/20">
            <div className="flex gap-2 items-center">
              <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase">Sort:</span>
              <button 
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="text-[10px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">{sortOrder === 'newest' ? 'arrow_downward' : 'arrow_upward'}</span>
                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              </button>
            </div>
            
            {(selectedStatus || selectedPriority || selectedCategory || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] font-bold text-error hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[12px]">filter_alt_off</span>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Category Capsule Strip */}
        <div className="pt-1 border-t border-outline-variant/20">
          <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar scrollbar-thin select-none">
            {([
              'Royalty & Payments',
              'ISBN & Metadata Issues',
              'Printing & Quality',
              'Distribution & Availability',
              'Book Status & Production Updates',
              'General Inquiry'
            ] as CategoryType[]).map(cat => {
              const isActive = selectedCategory === cat;
              const shortName = cat.split(' & ')[0].split(' Issues')[0];
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight uppercase whitespace-nowrap transition-all border cursor-pointer ${
                    isActive 
                      ? 'bg-primary-container border-primary text-primary shadow-sm scale-[1.02]' 
                      : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant/70 hover:bg-surface-container'
                  }`}
                  title={cat}
                >
                  {shortName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center px-0.5 pt-1">
          <span className="text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-[0.12em]">Inbox · {filteredTickets.length}</span>
        </div>
      </div>

      {/* Scrollable Queue List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {filteredTickets.map((ticket) => {
          const isActive = selectedTicket?._id === ticket._id;
          const priorityClass = `priority-${ticket.priority.toLowerCase()}`;
          const lastMsg = ticket.messages?.[ticket.messages.length - 1];
          const isUrgentAndOpen = (ticket.status === 'Open' || ticket.status === 'In Progress') && (ticket.priority === 'Critical' || ticket.priority === 'High');

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
              className={`ticket-card px-4 py-3.5 cursor-pointer relative border-b border-outline-variant/10 ${
                isActive ? 'active bg-primary/[0.04]' : 'hover:bg-surface-container-low/30'
              }`}
            >
              {/* Active / Urgency Indicator Bar */}
              {isActive && <div className="absolute left-0 top-2 bottom-2 w-[3.5px] rounded-r-full bg-primary z-10" />}
              {isUrgentAndOpen && !isActive && <div className="absolute left-0 top-2 bottom-2 w-[3.5px] rounded-r-full bg-red-600 animate-pulse z-10" />}
              
              <div className="flex gap-3">
                {/* Author Avatar */}
                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold mt-0.5 shadow-sm transition-colors ${
                  isActive ? 'bg-primary text-white font-black' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {ticket.author?.name?.charAt(0) || '?'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[12px] font-bold text-on-surface truncate">{ticket.author?.name}</span>
                    <span className="text-[10px] text-outline shrink-0 font-medium">{timeAgo}</span>
                  </div>
                  <h3 className="text-[13px] font-semibold text-on-surface truncate leading-snug">{ticket.subject}</h3>
                  {lastMsg && (
                    <p className="text-[11px] text-on-surface-variant/60 truncate mt-0.5 leading-snug">
                      {lastMsg.isInternal ? '[Internal Note] ' : ''}
                      {lastMsg.message?.substring(0, 60)}{lastMsg.message?.length > 60 ? '...' : ''}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className={`${getPriorityClasses(ticket.priority)} px-2 py-[0.5px] rounded-full text-[8.5px] font-bold uppercase tracking-wider`}>
                      {ticket.priority}
                    </span>
                    <span className="flex items-center gap-1">
                      {ticket.status === 'Open' && <span className="w-1.5 h-1.5 rounded-full bg-error status-dot-open" />}
                      {ticket.status === 'In Progress' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      {ticket.status === 'Resolved' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        ticket.status === 'Open' ? 'text-error' :
                        ticket.status === 'Resolved' ? 'text-green-700' :
                        ticket.status === 'In Progress' ? 'text-primary' : 'text-on-surface-variant/50'
                      }`}>{ticket.status}</span>
                    </span>
                    {ticket.assigned_admin && (
                      <span className="bg-primary/5 text-primary text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-[0.5px] rounded-md border border-primary/10 truncate max-w-[120px]">
                        Owner: {ticket.assigned_admin.name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredTickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center select-none">
            <span className="material-symbols-outlined text-[40px] text-outline-variant/40 mb-3 animate-bounce">inbox</span>
            <p className="text-[13px] font-semibold text-on-surface-variant/50">No tickets match active capsules</p>
            <button 
              onClick={clearAllFilters}
              className="text-[11px] text-primary hover:underline font-bold mt-2 cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Resizer Handle */}
      <div 
        onMouseDown={startResizeQueue}
        className="absolute right-0 top-0 bottom-0 w-[4px] cursor-col-resize hover:bg-primary/30 z-30 transition-colors active:bg-primary/60"
        title="Drag to resize queue sidebar"
      />
    </section>
  );
}
