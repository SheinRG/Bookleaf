"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: 'messages' | 'manuscripts' | 'royalties';
  setActiveTab: (tab: 'messages' | 'manuscripts' | 'royalties') => void;
  user: any;
  logout: () => void;
  openTicketsCount: number;
}

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  user,
  logout,
  openTicketsCount
}: AdminSidebarProps) {
  return (
    <motion.aside 
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-gradient-to-b from-[#1c1b1b] to-[#2a2123] border-r border-[#3a2f31] text-white/90 flex flex-col h-full py-5 px-3 shrink-0 z-40 relative select-none overflow-hidden"
    >
      {/* Brand/Logo — Toggles Sidebar */}
      <div 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="px-2 mb-8 flex items-center gap-3 cursor-pointer group"
        title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        <motion.div
          whileHover={{ scale: 1.06 }}
          className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shrink-0"
        >
          <img src="/logo.ico" alt="BookLeaf" className="w-full h-full object-cover" />
        </motion.div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-w-0"
            >
              <h1 className="text-[18px] font-bold text-white tracking-tight leading-tight">BookLeaf</h1>
              <p className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium">Admin Console</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-1">
        {[
          { id: 'messages' as const, icon: 'forum', label: 'Messages', badge: openTicketsCount },
          { id: 'manuscripts' as const, icon: 'auto_stories', label: 'Manuscripts' },
          { id: 'royalties' as const, icon: 'account_balance_wallet', label: 'Royalties' },
        ].map(item => (
          <motion.div 
            key={item.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-nav-item flex items-center gap-3 px-3 py-2.5 cursor-pointer ${
              activeTab === item.id ? 'active' : ''
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${activeTab === item.id ? 'text-primary-fixed-dim' : 'text-white/50'}`}>{item.icon}</span>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex items-center justify-between min-w-0"
                >
                  <span className={`text-[13px] font-medium ${activeTab === item.id ? 'text-white' : 'text-white/60'}`}>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="bg-primary text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">{item.badge}</span>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </nav>

      {/* User Section & Logout */}
      <div className="mt-auto space-y-3 px-1">
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-3 py-2"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-primary-fixed-dim text-xs font-bold">{user?.name?.charAt(0) || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12px] font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-white/30 text-[10px] truncate">{user?.email || ''}</p>
            </div>
          </motion.div>
        )}
        <button 
          onClick={logout} 
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-white/5 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          {sidebarOpen && <span className="text-[12px] font-medium">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
