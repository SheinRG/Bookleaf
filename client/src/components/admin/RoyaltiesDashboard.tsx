"use client";

import React from 'react';

interface RoyaltiesDashboardProps {
  books: any[];
  isActionLoading: string | null;
  payRoyalties: (bookId: string) => Promise<void>;
}

export default function RoyaltiesDashboard({
  books,
  isActionLoading,
  payRoyalties
}: RoyaltiesDashboardProps) {
  // Financial metrics aggregation
  const copiesSold = books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0);
  const totalEarned = books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0);
  const totalPaid = books.reduce((acc, b) => acc + (b.royalty_paid || 0), 0);
  const totalPending = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-background">
      {/* Header */}
      <div className="mb-6 select-none">
        <h2 className="text-[20px] font-bold text-on-surface">Royalties</h2>
        <p className="text-[12px] text-on-surface-variant/60 mt-0.5 font-medium">Monitor sales data, evaluate metrics, and disburse payouts</p>
      </div>

      {/* Financial Metrics Cards (High wow-factor!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 select-none">
        {[
          { icon: 'auto_stories', label: 'Copies Sold', value: copiesSold.toLocaleString(), suffix: 'units', color: 'bg-primary/10 text-primary' },
          { icon: 'account_balance_wallet', label: 'Total Earned', value: `₹${totalEarned.toLocaleString()}`, color: 'bg-primary/10 text-primary' },
          { icon: 'payments', label: 'Total Paid', value: `₹${totalPaid.toLocaleString()}`, color: 'bg-green-50 text-green-700 font-bold' },
          { icon: 'hourglass_empty', label: 'Pending Payouts', value: `₹${totalPending.toLocaleString()}`, color: 'bg-amber-50 text-amber-700 font-bold' },
        ].map(metric => (
          <div key={metric.label} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 flex items-center gap-4 shadow-md transition-transform duration-200 hover:scale-[1.02]">
            <div className={`w-10 h-10 rounded-xl ${metric.color} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-[20px]">{metric.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">{metric.label}</p>
              <h3 className="text-[18px] font-bold text-white mt-0.5 leading-tight">
                {metric.value} {metric.suffix && <span className="text-[11px] text-neutral-500 font-normal">{metric.suffix}</span>}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Royalties Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden mb-8 select-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-[0.1em] bg-surface-container/30">
                <th className="py-4 px-5">Book Details</th>
                <th className="py-4 px-5">Copies Sold</th>
                <th className="py-4 px-5">Royalty Earned</th>
                <th className="py-4 px-5 text-green-700">Paid</th>
                <th className="py-4 px-5 text-amber-700">Pending</th>
                <th className="py-4 px-5">Last Payout</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-sm text-on-surface">
              {books.map(book => (
                <tr key={book._id} className="hover:bg-surface-container-high/20 transition-colors">
                  <td className="py-4 px-6 font-bold text-primary">
                    <div className="flex flex-col font-medium">
                      <span className="font-bold text-primary">{book.title}</span>
                      <span className="text-[11px] text-on-surface-variant font-normal">Author: {book.author?.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-on-surface/85">{book.total_copies_sold || 0}</td>
                  <td className="py-4 px-6 font-bold text-on-surface/85">₹{book.total_royalty_earned || 0}</td>
                  <td className="py-4 px-6 text-green-700 font-bold">₹{book.royalty_paid || 0}</td>
                  <td className="py-4 px-6 text-amber-700 font-bold">₹{book.royalty_pending || 0}</td>
                  <td className="py-4 px-6 text-on-surface-variant/80 font-medium">
                    {book.last_royalty_payout_date 
                      ? new Date(book.last_royalty_payout_date).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {book.royalty_pending > 0 ? (
                      <button 
                        onClick={() => payRoyalties(book._id)}
                        disabled={isActionLoading === book._id}
                        className="bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 px-4 py-2 rounded-full font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        {isActionLoading === book._id ? 'Paying...' : `Pay Payout`}
                      </button>
                    ) : (
                      <span className="text-green-700 font-bold text-xs flex items-center justify-end gap-1 select-none">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Paid Up
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant opacity-60 font-body-md select-none">
                    No books available to calculate royalties.
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
