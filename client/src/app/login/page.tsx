"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<'author' | 'admin'>('author');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      if (data.user.role !== role) {
        setError(`You are not an ${role}. Please switch to the ${data.user.role === 'admin' ? 'Admin' : 'Author'} Login tab.`);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/author');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full max-w-[440px] z-10 animate-fade-in mx-auto mt-20 px-gutter">
      <div className="glass-card rounded-xl p-lg flex flex-col items-center">
        {/* Brand Anchor */}
        <div className="mb-md flex flex-col items-center">
          <img alt="BookLeaf Brand Logo" className="w-16 h-16 object-contain mb-sm" src="/logo.png" />
          <h1 className="font-headline-md text-headline-md text-primary tracking-tight">BookLeaf</h1>
          <p className="font-label-md text-label-md text-secondary uppercase tracking-widest mt-1">Portal Login</p>
        </div>

        {error && (
          <div className="w-full mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Login Type Toggle */}
        <div className="w-full bg-surface-container rounded-full p-xs flex mb-lg relative">
          <div 
            className={`absolute top-xs bottom-xs w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out ${role === 'admin' ? 'left-[calc(50%+2px)]' : 'left-xs'}`} 
            id="toggle-indicator"
          ></div>
          <button 
            type="button"
            className={`relative z-10 flex-1 py-sm font-label-md text-label-md transition-colors duration-300 ${role === 'author' ? 'text-primary' : 'text-on-surface-variant'}`} 
            onClick={() => setRole('author')}
          >
            Author Login
          </button>
          <button 
            type="button"
            className={`relative z-10 flex-1 py-sm font-label-md text-label-md transition-colors duration-300 ${role === 'admin' ? 'text-primary' : 'text-on-surface-variant'}`} 
            onClick={() => setRole('admin')}
          >
            Admin Login
          </button>
        </div>

        {/* Login Form */}
        <form className="w-full space-y-md" onSubmit={handleLogin}>
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant block px-1" htmlFor="email">Email Address</label>
            <div className="relative">
              <div className="absolute left-sm top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <input 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 pl-10 pr-4 font-body-md text-body-md transition-all text-on-surface" 
                id="email" 
                placeholder="name@publisher.com" 
                required 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-xs">
            <div className="flex justify-between items-center px-1">
              <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
              <a className="font-label-md text-label-md text-primary hover:underline transition-all" href="#">Forgot Password?</a>
            </div>
            <div className="relative">
              <div className="absolute left-sm top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-outline">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input 
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-3 pl-10 pr-4 font-body-md text-body-md transition-all text-on-surface" 
                id="password" 
                placeholder="••••••••" 
                required 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {/* Primary Action */}
          <button 
            className="w-full bg-primary text-on-primary py-4 rounded-lg font-label-md text-label-md uppercase tracking-wider shadow-md hover:bg-on-primary-fixed-variant active:scale-[0.98] transition-all flex items-center justify-center gap-sm mt-base" 
            type="submit"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            {isLoading && <div className="spinner"></div>}
          </button>
        </form>
        {/* Secondary Actions */}
        <div className="mt-lg pt-md border-t border-outline-variant w-full text-center">
          <p className="font-label-md text-on-surface-variant">
            Don't have an account? 
            <a className="text-primary font-semibold hover:underline ml-1" href="#">Request Access</a>
          </p>
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-md text-center">
        <p className="font-label-md text-label-md text-on-surface-variant opacity-60">© 2024 BookLeaf Publishing Systems. All rights reserved.</p>
      </footer>
    </main>
  );
}
