"use client";

import React from 'react';

interface ManuscriptsTableProps {
  books: any[];
  isActionLoading: string | null;
  updateBookStatus: (bookId: string, newStatus: string) => Promise<void>;
}

export default function ManuscriptsTable({
  books,
  isActionLoading,
  updateBookStatus
}: ManuscriptsTableProps) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-background">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center select-none">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Manuscripts</h2>
          <p className="text-[12px] text-on-surface-variant/60 mt-0.5 font-medium">Review, track, and approve author book manuscripts</p>
        </div>
        <div className="bg-surface-container-high rounded-xl px-4 py-2 text-[12px] font-bold text-on-surface-variant shadow-sm border border-outline-variant/20">
          {books.length} manuscripts
        </div>
      </div>

      {/* Manuscripts Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden mb-8 select-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-[0.1em] bg-surface-container/30">
                <th className="py-4 px-5">Book Title</th>
                <th className="py-4 px-5">Author</th>
                <th className="py-4 px-5">Genre</th>
                <th className="py-4 px-5">MRP</th>
                <th className="py-4 px-5">Royalty/Copy</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-sm text-on-surface">
              {books.map(book => (
                <tr key={book._id} className="hover:bg-surface-container-high/20 transition-colors">
                  <td className="py-4 px-6 font-bold text-primary">{book.title}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-bold">{book.author?.name}</span>
                      <span className="text-[11px] text-on-surface-variant font-mono">{book.author?.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-surface-container px-3 py-1 rounded-full text-secondary font-bold text-xs">
                      {book.genre || 'General'}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-on-surface/85">₹{book.mrp || 0}</td>
                  <td className="py-4 px-6 font-bold text-on-surface/85">₹{book.author_royalty_per_copy || 0}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                      book.status === 'Published' 
                        ? 'bg-primary-container text-on-primary-container' 
                        : book.status === 'Under Review'
                        ? 'bg-secondary-fixed text-on-secondary-fixed animate-pulse'
                        : 'bg-surface-container-highest text-secondary'
                    }`}>
                      {book.status || 'Draft'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {book.status !== 'Published' ? (
                      <button 
                        onClick={() => updateBookStatus(book._id, 'Published')}
                        disabled={isActionLoading === book._id}
                        className="bg-primary text-on-primary hover:brightness-110 disabled:opacity-50 px-4 py-2 rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        {isActionLoading === book._id ? 'Publishing...' : 'Approve & Publish'}
                      </button>
                    ) : (
                      <span className="text-green-700 font-bold text-xs flex items-center justify-end gap-1 select-none">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Published
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant opacity-60 font-body-md select-none">
                    No manuscripts found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
