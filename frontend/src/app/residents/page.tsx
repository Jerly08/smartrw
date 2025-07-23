'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import ResidentManagement from '@/components/residents/ResidentManagement';

export default function ResidentsPage() {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Prevent rendering if not authenticated
  if (!user) {
    return null;
  }

  return <ResidentManagement />;
} 