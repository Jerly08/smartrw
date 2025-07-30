import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import VerifyResidentForm from '../components/VerifyResidentForm';

const VerifyPage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    // You can add additional checks here to verify token validity
    setIsAuthenticated(true);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // This will not render while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verifikasi Data Warga
            </h1>
            <p className="text-gray-600">
              Lengkapi data Anda untuk verifikasi sebagai warga di RT yang dipilih
            </p>
          </div>
          
          <VerifyResidentForm />
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
