'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Protect routes - redirect to login if not authenticated
  useEffect(() => {
    console.log('Dashboard layout effect - user:', user, 'loading:', loading);
    if (!loading && !user) {
      console.log('No user detected, redirecting to login');
      router.replace('/login');
    } else if (!loading && user) {
      console.log('User authenticated in dashboard layout:', user);
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    console.log('Dashboard layout - showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render children until authentication check is complete
  if (!user) {
    console.log('Dashboard layout - no user, returning null');
    return null;
  }

  console.log('Dashboard layout - rendering with user:', user);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 