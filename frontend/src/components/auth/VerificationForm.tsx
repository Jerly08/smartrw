
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authApi, rtApi } from '@/lib/api';
import { FiUpload, FiUser, FiCalendar, FiHome, FiMapPin, FiUsers } from 'react-icons/fi';

interface RT {
  id: number;
  number: string;
}

export default function VerificationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [kkFile, setKkFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
const [address, setAddress] = useState('');
  const [nik, setNik] = useState('');
  const [noKK, setNoKK] = useState('');
  const [gender, setGender] = useState('');
  const [familyRole, setFamilyRole] = useState('');
  const [rtNumber, setRtNumber] = useState('');
  const [rtList, setRtList] = useState<RT[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch RTs
        const rtResponse = await rtApi.getAllRTs({ limit: 100 });
        setRtList(rtResponse.rts || []);
        
        // Fetch user profile to check if resident data exists
        const profile = await authApi.getProfile();
        if (profile.resident) {
          const resident = profile.resident;
          setFullName(resident.fullName || '');
          setBirthDate(resident.birthDate ? new Date(resident.birthDate).toISOString().split('T')[0] : '');
          setAddress(resident.address || '');
          setNik(resident.nik || '');
          setNoKK(resident.noKK || '');
          setGender(resident.gender || '');
          setFamilyRole(resident.familyRole || '');
          setRtNumber(resident.rtNumber || '');
        }
      } catch (error) {
        console.error('Gagal mengambil data', error);
        toast.error('Gagal mengambil data');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi';
    if (!birthDate) newErrors.birthDate = 'Tanggal lahir wajib diisi';
    if (!address.trim()) newErrors.address = 'Alamat wajib diisi';
    if (!rtNumber) newErrors.rtNumber = 'RT wajib dipilih';
    if (!nik.trim() || !/^\d{16}$/.test(nik)) newErrors.nik = 'NIK harus 16 digit angka';
    if (!noKK.trim() || !/^\d{16}$/.test(noKK)) newErrors.noKK = 'Nomor KK harus 16 digit angka';
    if (!gender) newErrors.gender = 'Jenis kelamin wajib dipilih';
    if (!familyRole) newErrors.familyRole = 'Status dalam keluarga wajib dipilih';
    
    // File validation
    const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
    
    if (ktpFile) {
      if (ktpFile.size > maxFileSize) {
        newErrors.ktp = 'File KTP tidak boleh lebih dari 5MB';
      }
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(ktpFile.type)) {
        newErrors.ktp = 'File KTP harus berformat PNG, JPG, atau PDF';
      }
    }
    
    if (kkFile) {
      if (kkFile.size > maxFileSize) {
        newErrors.kk = 'File KK tidak boleh lebih dari 5MB';
      }
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(kkFile.type)) {
        newErrors.kk = 'File KK harus berformat PNG, JPG, atau PDF';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setIsLoading(true);
    try {
      // Find RT by number to get ID
      const selectedRT = rtList.find(rt => rt.number === rtNumber);
      if (!selectedRT) {
        toast.error('RT yang dipilih tidak valid');
        return;
      }

      // First, submit the basic resident data
      const verifyResponse = await authApi.verify({
        name: fullName,
        birthDate: birthDate,
        address: address,
        rtId: selectedRT.id,
        nik,
        noKK,
        gender,
        familyRole,
      });

      // Then, if there are files to upload, upload them
      if (ktpFile || kkFile) {
        const formData = new FormData();
        
        // Add the resident data to form data for backend processing
        formData.append('name', fullName);
        formData.append('birthDate', birthDate);
        formData.append('address', address);
        formData.append('rtId', selectedRT.id.toString());
        formData.append('nik', nik);
        formData.append('noKK', noKK);
        formData.append('gender', gender);
        formData.append('familyRole', familyRole);
        
        // Add files
        if (ktpFile) {
          formData.append('ktp', ktpFile);
        }
        if (kkFile) {
          formData.append('kk', kkFile);
        }
        
        const uploadResponse = await authApi.uploadVerificationDocuments(formData);
        
        toast.success(
          verifyResponse.isUpdate 
            ? 'Data dan dokumen berhasil diperbarui! Menunggu verifikasi ulang dari RT.' 
            : 'Data dan dokumen berhasil diunggah! Menunggu verifikasi dari RT.'
        );
      } else {
        // Show appropriate success message for data-only submission
        toast.success(
          verifyResponse.isUpdate 
            ? verifyResponse.message || 'Data verifikasi berhasil diperbarui dan menunggu verifikasi ulang dari RT'
            : verifyResponse.message || 'Data berhasil diunggah. Menunggu verifikasi dari RT terpilih.'
        );
      }
      
      // Reset only file inputs, keep data for user convenience
      setKtpFile(null);
      setKkFile(null);
      
      // Reset file input elements
      const ktpInput = document.getElementById('ktp') as HTMLInputElement;
      const kkInput = document.getElementById('kk') as HTMLInputElement;
      if (ktpInput) ktpInput.value = '';
      if (kkInput) kkInput.value = '';
      
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal mengunggah data. Silakan coba lagi.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="max-w-md mx-auto text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Upload Dokumen Verifikasi</h3>
        <p className="text-gray-600 text-sm">
          Silakan isi data diri dan unggah foto/scan KTP dan KK Anda untuk proses verifikasi akun.
        </p>
        {fullName && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Info:</strong> Anda sudah memiliki data verifikasi. Anda dapat memperbarui data di bawah ini.
            </p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nama Lengkap */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sesuai KTP" />
          </div>
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        {/* Tanggal Lahir */}
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">Tanggal Lahir *</label>
          <div className="relative">
            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
        </div>

{/* NIK */}
        <div>
          <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-2">NIK *</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input id="nik" type="text" value={nik} onChange={(e) => setNik(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="16 digit NIK" maxLength={16} />
          </div>
          {errors.nik && <p className="text-red-500 text-sm mt-1">{errors.nik}</p>}
        </div>

        {/* Nomor KK */}
        <div>
          <label htmlFor="noKK" className="block text-sm font-medium text-gray-700 mb-2">Nomor KK *</label>
          <div className="relative">
            <FiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input id="noKK" type="text" value={noKK} onChange={(e) => setNoKK(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="16 digit Nomor KK" maxLength={16} />
          </div>
          {errors.noKK && <p className="text-red-500 text-sm mt-1">{errors.noKK}</p>}
        </div>

        {/* Jenis Kelamin */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin *</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="" disabled>-- Pilih Jenis Kelamin --</option>
              <option value="LAKI_LAKI">Laki-laki</option>
              <option value="PEREMPUAN">Perempuan</option>
            </select>
          </div>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
        </div>

        {/* Status dalam Keluarga */}
        <div>
          <label htmlFor="familyRole" className="block text-sm font-medium text-gray-700 mb-2">Status dalam Keluarga *</label>
          <div className="relative">
            <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select id="familyRole" value={familyRole} onChange={(e) => setFamilyRole(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="" disabled>-- Pilih Status --</option>
              <option value="KEPALA_KELUARGA">Kepala Keluarga</option>
              <option value="ISTRI">Istri</option>
              <option value="ANAK">Anak</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>
          {errors.familyRole && <p className="text-red-500 text-sm mt-1">{errors.familyRole}</p>}
        </div>

        {/* Alamat */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Alamat *</label>
          <div className="relative">
            <FiHome className="absolute left-3 top-3 text-gray-400" />
            <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sesuai KTP" rows={3}></textarea>
          </div>
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>

        {/* RT */}
        <div>
          <label htmlFor="rtNumber" className="block text-sm font-medium text-gray-700 mb-2">Pilih RT *</label>
          <div className="relative">
            <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select id="rtNumber" value={rtNumber} onChange={(e) => setRtNumber(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
              <option value="" disabled>-- Pilih RT --</option>
              {rtList.map(rt => (
                <option key={rt.id} value={rt.number}>RT {rt.number}</option>
              ))}
            </select>
          </div>
          {errors.rtNumber && <p className="text-red-500 text-sm mt-1">{errors.rtNumber}</p>}
        </div>

        {/* KTP Upload */}
        <div>
          <label htmlFor="ktp" className="block text-sm font-medium text-gray-700 mb-2">Scan KTP *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <FiUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <input id="ktp" type="file" accept="image/png,image/jpeg,image/jpg,.pdf" onChange={(e) => setKtpFile(e.target.files?.[0] || null)} className="hidden" />
            <label htmlFor="ktp" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500">{ktpFile ? ktpFile.name : 'Pilih file KTP'}</span>
              <p className="text-xs text-gray-500 mt-1">PDF, PNG, atau JPG hingga 5MB</p>
            </label>
          </div>
          {errors.ktp && <p className="text-red-500 text-sm mt-1">{errors.ktp}</p>}
        </div>

        {/* KK Upload */}
        <div>
          <label htmlFor="kk" className="block text-sm font-medium text-gray-700 mb-2">Scan KK *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <FiUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <input id="kk" type="file" accept="image/*,.pdf" onChange={(e) => setKkFile(e.target.files?.[0] || null)} className="hidden" />
            <label htmlFor="kk" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-500">{kkFile ? kkFile.name : 'Pilih file KK'}</span>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF hingga 5MB</p>
            </label>
          </div>
          {errors.kk && <p className="text-red-500 text-sm mt-1">{errors.kk}</p>}
        </div>

        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isLoading ? 'Mengunggah...' : 'Kirim Verifikasi'}
        </button>
      </form>
    </div>
  );
}

