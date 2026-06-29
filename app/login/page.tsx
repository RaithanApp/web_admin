'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(false);
    setErrorMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.user) {
        // Successfully authenticated, route them into the app
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccountMock = () => {
    alert('Account deletion workflows must be handled within authenticated sessions.');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-50 font-sans select-none overflow-hidden">
      
      {/* Top Right Action Header Bar */}
      <div className="absolute top-0 right-0 p-6 z-20">
        <button
          onClick={handleDeleteAccountMock}
          type="button"
          className="bg-[#ff4d4d] hover:bg-red-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg shadow transition-all duration-200 ease-in-out"
        >
          Delete Account
        </button>
      </div>

      {/* Main Container Layering */}
      <div className="relative w-full max-w-[440px] px-4 md:px-0">
        
        {/* Abstract Green Backdrop Asset Shadow Box */}
        <div className="absolute top-12 left-10 w-full h-[480px] bg-[#52b100] rounded-2xl transform rotate-0 z-0 shadow-sm" />

        {/* Floating White Authentication Card */}
        <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-10 z-10 w-full min-h-[480px] flex flex-col justify-center">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1f2937] tracking-tight mb-1.5">
              Sign in
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Sign in to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Context Feedback Message Block */}
            {errorMessage && (
              <div className="text-xs bg-red-50 text-red-500 border border-red-100 p-3 rounded-lg font-medium text-center">
                {errorMessage}
              </div>
            )}

            <div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Your Email"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-0 text-sm transition-all"
              />
            </div>

            <div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-0 text-sm transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#52b100] hover:bg-[#469600] active:scale-[0.99] text-white font-bold py-3.5 rounded-lg shadow-md text-sm tracking-wide transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
            </div>
          </form>

          {/* Ancillary Footer Routing Block */}
          <div className="mt-8 text-center flex items-center justify-center space-x-1.5 text-xs font-semibold text-gray-700">
            <span>Forgot your password?</span>
            <a 
              href="/privacy-policy" 
              className="text-[#2563eb] hover:underline cursor-pointer"
            >
              Privacy Policy
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}