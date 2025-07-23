'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { FiSettings, FiUser, FiLock, FiMail, FiPhone, FiBell } from 'react-icons/fi';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-64 border-r border-gray-200">
            <nav className="p-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors mb-2 ${
                  activeTab === 'profile'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FiUser className="mr-3 text-lg" />
                <span>Profil</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors mb-2 ${
                  activeTab === 'security'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FiLock className="mr-3 text-lg" />
                <span>Keamanan</span>
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors mb-2 ${
                  activeTab === 'notifications'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <FiBell className="mr-3 text-lg" />
                <span>Notifikasi</span>
              </button>
              
              {(user?.role === 'ADMIN' || user?.role === 'RW') && (
                <button
                  onClick={() => setActiveTab('system')}
                  className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors mb-2 ${
                    activeTab === 'system'
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <FiSettings className="mr-3 text-lg" />
                  <span>Sistem</span>
                </button>
              )}
            </nav>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Pengaturan Profil</h2>
                <p className="text-gray-600 mb-6">
                  Kelola informasi profil Anda dan bagaimana informasi tersebut ditampilkan.
                </p>
                
                <form className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      defaultValue={user?.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      defaultValue={user?.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Keamanan</h2>
                <p className="text-gray-600 mb-6">
                  Kelola kata sandi dan pengaturan keamanan akun Anda.
                </p>
                
                <form className="space-y-6">
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      id="current-password"
                      name="current-password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      id="new-password"
                      name="new-password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      name="confirm-password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Ubah Kata Sandi
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Pengaturan Notifikasi</h2>
                <p className="text-gray-600 mb-6">
                  Kelola preferensi notifikasi Anda.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                    <div>
                      <h3 className="font-medium text-gray-800">Notifikasi Dokumen</h3>
                      <p className="text-sm text-gray-500">Dapatkan pemberitahuan tentang status dokumen Anda</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="document-notifications"
                        name="document-notifications"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                    <div>
                      <h3 className="font-medium text-gray-800">Notifikasi Kegiatan</h3>
                      <p className="text-sm text-gray-500">Dapatkan pemberitahuan tentang kegiatan yang akan datang</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="event-notifications"
                        name="event-notifications"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                    <div>
                      <h3 className="font-medium text-gray-800">Notifikasi Forum</h3>
                      <p className="text-sm text-gray-500">Dapatkan pemberitahuan tentang aktivitas di forum</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="forum-notifications"
                        name="forum-notifications"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Simpan Preferensi
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'system' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Pengaturan Sistem</h2>
                <p className="text-gray-600 mb-6">
                  Kelola pengaturan sistem aplikasi Smart RW.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Informasi RW</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="rw-name" className="block text-sm font-medium text-gray-700 mb-1">
                          Nama RW
                        </label>
                        <input
                          type="text"
                          id="rw-name"
                          name="rw-name"
                          defaultValue="RW 01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="rw-address" className="block text-sm font-medium text-gray-700 mb-1">
                          Alamat
                        </label>
                        <textarea
                          id="rw-address"
                          name="rw-address"
                          rows={3}
                          defaultValue="Jl. Contoh No. 123, Kelurahan Contoh, Kecamatan Contoh, Kota Contoh"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Pengaturan Email</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="email-sender" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Pengirim
                        </label>
                        <input
                          type="email"
                          id="email-sender"
                          name="email-sender"
                          defaultValue="admin@smartrw.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <button
                      type="button"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Simpan Pengaturan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 