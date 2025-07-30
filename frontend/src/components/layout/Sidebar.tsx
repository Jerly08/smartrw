'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  FiHome, 
  FiUsers, 
  FiFileText, 
  FiCalendar, 
  FiAlertCircle, 
  FiPackage, 
  FiMessageSquare,
  FiSettings,
  FiBell,
  FiCheckSquare
} from 'react-icons/fi';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  role?: string[];
}

const NavItem = ({ href, icon, label, active, role }: NavItemProps) => {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
        active
          ? 'bg-blue-100 text-blue-800'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <span className="mr-3 text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';
  const isRT = user?.role === 'RT';
  const isWarga = user?.role === 'WARGA';

  return (
    <div className="w-64 bg-white shadow-md flex-shrink-0">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            RW
          </div>
          <span className="ml-2 text-xl font-bold text-blue-600">Smart RW</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Menu Utama
        </div>
        <nav className="space-y-1">
          <NavItem 
            href="/dashboard" 
            icon={<FiHome />} 
            label="Dashboard" 
            active={pathname === '/dashboard'} 
          />
          
          <NavItem 
            href="/dashboard/notifikasi" 
            icon={<FiBell />} 
            label="Notifikasi" 
            active={pathname?.startsWith('/dashboard/notifikasi') || false} 
          />
          
          {(isAdmin || isRW || isRT) && (
            <NavItem 
              href="/dashboard/warga" 
              icon={<FiUsers />} 
              label="Data Warga" 
              active={pathname?.startsWith('/dashboard/warga') || false} 
            />
          )}
          
          <NavItem 
            href="/dashboard/surat" 
            icon={<FiFileText />} 
            label="Administrasi Surat" 
            active={pathname?.startsWith('/dashboard/surat') || false} 
          />
          
          {(isAdmin || isRW) && (
            <div className="pl-6 mt-1 space-y-1">
              <NavItem 
                href="/dashboard/surat/template" 
                icon={<FiFileText />} 
                label="Template Dokumen" 
                active={pathname?.startsWith('/dashboard/surat/template') || false} 
              />
              <NavItem 
                href="/dashboard/surat/digital-signature" 
                icon={<FiFileText />} 
                label="Tanda Tangan Digital" 
                active={pathname?.startsWith('/dashboard/surat/digital-signature') || false} 
              />
              <NavItem 
                href="/dashboard/surat/statistics" 
                icon={<FiFileText />} 
                label="Statistik Dokumen" 
                active={pathname?.startsWith('/dashboard/surat/statistics') || false} 
              />
            </div>
          )}
          
          <NavItem 
            href="/dashboard/kegiatan" 
            icon={<FiCalendar />} 
            label="Agenda & Kegiatan" 
            active={pathname?.startsWith('/dashboard/kegiatan') || false} 
          />
          
          <NavItem 
            href="/dashboard/pengaduan" 
            icon={<FiAlertCircle />} 
            label="Pengaduan" 
            active={pathname?.startsWith('/dashboard/pengaduan') || false} 
          />
          
          {(isAdmin || isRW || isRT) && (
            <NavItem 
              href="/dashboard/bantuan" 
              icon={<FiPackage />} 
              label="Bantuan Sosial" 
              active={(pathname?.startsWith('/dashboard/bantuan') && !pathname?.includes('/eligibility')) || false} 
            />
          )}
          
          {isWarga && (
            <NavItem 
              href="/dashboard/bantuan/eligibility" 
              icon={<FiPackage />} 
              label="Bantuan Sosial" 
              active={pathname?.startsWith('/dashboard/bantuan/eligibility') || false} 
            />
          )}

          <NavItem 
            href="/dashboard/forum" 
            icon={<FiMessageSquare />} 
            label="Forum Komunikasi" 
            active={pathname?.startsWith('/dashboard/forum') || false} 
          />
        </nav>
        
        <div className="mt-8 mb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Pengaturan
        </div>
        <nav className="space-y-1">
          {isWarga && (
            <NavItem 
              href="/dashboard/verifikasi" 
              icon={<FiCheckSquare />} 
              label="Verifikasi Akun" 
              active={pathname?.startsWith('/dashboard/verifikasi') || false} 
            />
          )}
          
          <NavItem 
            href="/dashboard/profil" 
            icon={<FiSettings />} 
            label="Pengaturan Profil" 
            active={pathname?.startsWith('/dashboard/profil') || false} 
          />
          
          <NavItem 
            href="/dashboard/pengaturan" 
            icon={<FiSettings />} 
            label="Pengaturan Sistem" 
            active={pathname?.startsWith('/dashboard/pengaturan') || false} 
          />
          
          {isAdmin && (
            <NavItem 
              href="/dashboard/admin" 
              icon={<FiSettings />} 
              label="Pengaturan Admin" 
              active={pathname?.startsWith('/dashboard/admin') || false} 
            />
          )}
        </nav>
      </div>
    </div>
  );
} 