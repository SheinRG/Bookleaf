"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL, getAuthToken } from '@/lib/api';

interface SubmitTicketFormProps {
  books: any[];
  onSubmitSuccess: () => void;
  setShowSuccessPopup: (show: boolean) => void;
}

export default function SubmitTicketForm({ books, onSubmitSuccess, setShowSuccessPopup }: SubmitTicketFormProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        onSubmitSuccess();
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      } else {
        alert('Failed to submit ticket');
      }
    } catch (e) {
      alert('Failed to submit ticket');
    }
    setIsSubmitting(false);
  };

  return (
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
  );
}
