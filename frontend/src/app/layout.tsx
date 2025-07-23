import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import ToastWrapper from '@/components/ui/ToastWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart RW - Sistem Informasi Rukun Warga',
  description: 'Aplikasi pengelolaan administrasi dan layanan Rukun Warga secara digital',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <ToastWrapper />
        </AuthProvider>
      </body>
    </html>
  );
} 