/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Aktifkan fitur eksperimental jika diperlukan
  },
  // Pastikan tidak ada konfigurasi yang mengganggu navigasi
  async redirects() {
    return [];
  },
};

module.exports = nextConfig; 