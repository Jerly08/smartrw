import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const VerifyResidentForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rts, setRts] = useState([]);
  const [loadingRTs, setLoadingRTs] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    address: '',
    rtId: ''
  });
  const [errors, setErrors] = useState({});

  // Fetch available RTs on component mount
  useEffect(() => {
    fetchAvailableRTs();
  }, []);

  const fetchAvailableRTs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/auth/rts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRts(data.data.rts);
      } else {
        console.error('Gagal mengambil data RT');
      }
    } catch (error) {
      console.error('Kesalahan saat mengambil data RT:', error);
    } finally {
      setLoadingRTs(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap harus diisi';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama lengkap minimal 2 karakter';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Tanggal lahir harus diisi';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat harus diisi';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Alamat minimal 5 karakter';
    }

    if (!formData.rtId) {
      newErrors.rtId = 'RT harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/auth/verify-resident', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          rtId: parseInt(formData.rtId)
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Verifikasi berhasil! Anda telah terdaftar di ${data.data.rt.name || `RT ${data.data.rt.number}`}`);
        router.push('/dashboard'); // Redirect to dashboard or appropriate page
      } else {
        alert(data.message || 'Verifikasi gagal');
      }
    } catch (error) {
      console.error('Kesalahan saat verifikasi:', error);
      alert('Terjadi kesalahan saat verifikasi');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRTs) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Verifikasi Data Warga
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama Lengkap */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Masukkan nama lengkap Anda"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Tanggal Lahir */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tanggal Lahir <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.birthDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.birthDate && (
            <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
          )}
        </div>

        {/* Alamat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alamat Lengkap <span className="text-red-500">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Masukkan alamat lengkap Anda"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        {/* Pilihan RT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pilih RT <span className="text-red-500">*</span>
          </label>
          <select
            name="rtId"
            value={formData.rtId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.rtId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">-- Pilih RT --</option>
            {rts.map((rt) => (
              <option key={rt.id} value={rt.id}>
                RT {rt.number} - {rt.name || 'Tidak ada nama'} 
                {rt.chairperson && ` (Ketua: ${rt.chairperson})`}
                {rt._count && ` (${rt._count.residents} warga)`}
              </option>
            ))}
          </select>
          {errors.rtId && (
            <p className="text-red-500 text-sm mt-1">{errors.rtId}</p>
          )}
        </div>

        {/* Selected RT Info */}
        {formData.rtId && (
          <div className="bg-blue-50 p-3 rounded-md">
            {(() => {
              const selectedRT = rts.find(rt => rt.id === parseInt(formData.rtId));
              return selectedRT ? (
                <div className="text-sm text-blue-800">
                  <p><strong>RT yang dipilih:</strong> RT {selectedRT.number}</p>
                  {selectedRT.name && <p><strong>Nama:</strong> {selectedRT.name}</p>}
                  {selectedRT.chairperson && <p><strong>Ketua RT:</strong> {selectedRT.chairperson}</p>}
                  {selectedRT.address && <p><strong>Wilayah:</strong> {selectedRT.address}</p>}
                  {selectedRT._count && <p><strong>Jumlah warga:</strong> {selectedRT._count.residents} orang</p>}
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Memproses...
            </div>
          ) : (
            'Verifikasi Data'
          )}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-md">
        <div className="text-sm text-yellow-800">
          <p className="font-medium mb-2">Informasi:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Data yang Anda masukkan akan tersimpan di RT yang dipilih</li>
            <li>Pastikan data yang dimasukkan benar dan sesuai dengan identitas Anda</li>
            <li>Setelah verifikasi berhasil, Anda akan dapat mengakses semua fitur sistem</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerifyResidentForm;
