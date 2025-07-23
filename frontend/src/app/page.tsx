import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                RW
              </div>
              <span className="ml-2 text-xl font-bold text-blue-600">Smart RW</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-16 sm:px-0 sm:py-24 lg:py-32">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  <span className="block">Kelola Rukun Warga</span>
                  <span className="block text-blue-600">dengan Mudah dan Efisien</span>
                </h1>
                <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto">
                  Smart RW adalah aplikasi pengelolaan administrasi dan layanan Rukun Warga secara digital, 
                  memudahkan komunikasi antara pengurus dan warga.
                </p>
                <div className="mt-10 flex justify-center">
                  <Link
                    href="/register"
                    className="px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Mulai Sekarang
                  </Link>
                  <Link
                    href="/login"
                    className="ml-4 px-8 py-3 text-base font-medium text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Masuk
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-gray-50 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">Fitur Utama</h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Solusi lengkap untuk pengelolaan Rukun Warga modern
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Data Warga Digital</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Kelola data warga dengan mudah, termasuk KTP, KK, dan informasi penting lainnya.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Surat Menyurat</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Buat dan kelola surat pengantar, surat keterangan, dan dokumen penting lainnya.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Pengaduan Warga</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Sampaikan aspirasi dan pengaduan dengan mudah dan dapatkan respons cepat.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Agenda Kegiatan</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Informasi kegiatan RW seperti kerja bakti, rapat, dan acara komunitas.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Bantuan Sosial</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Kelola dan pantau penyaluran bantuan sosial dengan transparan.
                  </p>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Forum Komunikasi</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Diskusi dan berbagi informasi antar warga dan pengurus RW.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-400">
              &copy; {new Date().getFullYear()} Smart RW. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 