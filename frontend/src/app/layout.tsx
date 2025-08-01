import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import ToastWrapper from '@/components/ui/ToastWrapper';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  fallback: ['system-ui', 'arial']
});

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
      <body className={poppins.className}>
        <AuthProvider>
          {children}
          <ToastWrapper />
        </AuthProvider>
      </body>
    </html>
  );
} 