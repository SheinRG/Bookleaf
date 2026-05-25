"use client";

import React from 'react';

interface BooksTableProps {
  books: any[];
}

export default function BooksTable({ books }: BooksTableProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-headline-md text-headline-md text-primary font-bold">Performance Overview</h3>
          <p className="font-label-md text-on-surface-variant mt-1">Track your publications and earnings in real-time.</p>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead className="bg-surface-container text-on-surface-variant font-label-md text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Book Title &amp; ISBN</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">MRP</th>
                <th className="px-6 py-4 text-right">Copies Sold</th>
                <th className="px-6 py-4 text-right">Total Earned</th>
                <th className="px-6 py-4 text-right">Paid</th>
                <th className="px-6 py-4 text-right bg-primary-container/10">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-sm text-on-surface">
              {books.map(book => (
                <tr key={book._id} className="hover:bg-background transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-primary">{book.title}</div>
                    <div className="text-xs text-on-surface-variant font-mono mt-0.5">{book.isbn || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${book.status === 'Published' ? 'bg-primary-container/20 text-on-primary-fixed-variant' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">₹{book.mrp || '-'}</td>
                  <td className="px-6 py-4 text-right font-medium">{book.total_copies_sold}</td>
                  <td className="px-6 py-4 text-right font-medium">₹{book.total_royalty_earned}</td>
                  <td className="px-6 py-4 text-right font-medium">₹{book.royalty_paid}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary bg-primary-container/5">₹{book.royalty_pending}</td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant opacity-60 font-body-md">No manuscripts or royalties found for your account.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
