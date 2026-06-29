'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      const isLoggedIn = !!session;
      setAuthenticated(isLoggedIn);

      if (!isLoggedIn && pathname !== '/login') {
        router.push('/login');
      }

      if (isLoggedIn && pathname == '/login') {
        router.push('/categories');
      }
      if (isLoggedIn && pathname == '/') {
        router.push('/categories');
      }
      
    };

    checkAuth();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        const isLoggedIn = !!session;
        setAuthenticated(isLoggedIn);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Prevent admin dashboard flickering during the localStorage lookup
  if (authenticated === null ) {
    return (
      <html lang="en">
        <body className="bg-gray-50 flex items-center justify-center min-h-screen font-sans">
          <div className="text-sm font-semibold text-gray-400">Loading App...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen antialiased text-gray-900 font-sans">
        {authenticated && <Navbar />}
        <main>{children}</main>
      </body>
    </html>
  );
}





export  function Navbar() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/categories" className="flex items-center gap-2">
        {/* Logo placeholder — swap with <Image> when you have the asset */}
        <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
          R
        </div>
        <span className="font-bold text-lg text-gray-900 tracking-tight">Raithan</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/providers"
          className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
        >
          Service Provider
        </Link>
        <Link
          href="/seekers"
          className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors"
        >
          Service Seeker
        </Link>
        <button
          onClick={handleLogout}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}