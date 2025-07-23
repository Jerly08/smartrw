'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NotificationType } from '@/lib/types/notification';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    loading: notificationsLoading,
    markAsRead
  } = useNotifications({ limit: 5 });

  // Handle notification click
  const handleNotificationClick = async (id: number) => {
    await markAsRead(id);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowDropdown(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
          >
            <FiMenu className="h-6 w-6" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-800">Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" data-dropdown>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none relative"
            >
              <FiBell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>

            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-2 px-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">Notifikasi</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">Memuat notifikasi...</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="py-1">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id)}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-500">{notification.timeAgo}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
                    </div>
                  )}
                </div>
                <div className="py-1 border-t border-gray-200">
                  <Link
                    href="/dashboard/notifikasi"
                    className="block px-4 py-2 text-sm text-center text-blue-600 hover:bg-gray-50"
                    onClick={() => setShowNotifications(false)}
                  >
                    Lihat semua notifikasi
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" data-dropdown>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <span className="font-medium">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <span className="hidden md:inline-block text-sm font-medium">{user?.name || 'User'}</span>
            </button>

            {showDropdown && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Link
                    href="/dashboard/profil"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FiUser className="mr-2 h-4 w-4" />
                    Profil
                  </Link>
                  <Link
                    href="/dashboard/pengaturan"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FiSettings className="mr-2 h-4 w-4" />
                    Pengaturan
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FiLogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 