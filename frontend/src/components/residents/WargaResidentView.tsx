import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { residentApi } from '@/lib/api';
import { 
  Resident, 
  Gender, 
  genderOptions,
  religionOptions,
  maritalStatusOptions,
  educationOptions,
  domicileStatusOptions,
  vaccinationStatusOptions,
  familyRoleOptions
} from '@/lib/types/resident';
import { FiEdit, FiUser, FiUsers, FiHome, FiAlertCircle } from 'react-icons/fi';

export default function WargaResidentView() {
  const { user } = useAuth();
  const [resident, setResident] = useState<Resident | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Resident[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUpdateRequestModal, setShowUpdateRequestModal] = useState<boolean>(false);
  const [updateRequest, setUpdateRequest] = useState<{ field: string; reason: string; newValue: string }>({
    field: '',
    reason: '',
    newValue: ''
  });
  const [requestSent, setRequestSent] = useState<boolean>(false);

  // Fetch resident data
  const fetchResidentData = async () => {
    setLoading(true);
    try {
      // For now, we'll use mock data since User doesn't have residentId
      // In a real implementation, you would get the resident ID from the user's profile
      // or fetch based on user email/ID from the residents table
      console.log('User resident data not available - User type needs residentId property');
      setResident(null);
    } catch (error) {
      console.error('Error fetching resident data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidentData();
  }, [user]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  // Get label for option value
  const getOptionLabel = (value: string | undefined, options: { value: string; label: string }[]) => {
    if (!value) return '-';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Handle update request
  const handleUpdateRequest = () => {
    // Here you would typically send this request to an API endpoint
    // For now, we'll just simulate a successful request
    console.log('Update request:', updateRequest);
    
    // Show success message and close modal
    setRequestSent(true);
    setTimeout(() => {
      setShowUpdateRequestModal(false);
      setRequestSent(false);
      setUpdateRequest({ field: '', reason: '', newValue: '' });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center text-red-500 mb-4">
          <FiAlertCircle className="mr-2" size={24} />
          <h2 className="text-xl font-semibold">Data Tidak Ditemukan</h2>
        </div>
        <p className="text-gray-600">
          Data warga untuk akun Anda tidak ditemukan. Silakan hubungi pengurus RT atau RW untuk mengaitkan akun Anda dengan data warga.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personal Info Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FiUser className="mr-2 text-blue-500" /> Data Pribadi
            </h2>
            <button
              onClick={() => setShowUpdateRequestModal(true)}
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <FiEdit className="mr-1" /> Ajukan Pembaruan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500">NIK</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.nik}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Nomor KK</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.noKK}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Nama Lengkap</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.fullName}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Jenis Kelamin</h3>
              <p className="mt-1 text-sm text-gray-900">
                {resident.gender === Gender.LAKI_LAKI ? 'Laki-laki' : 'Perempuan'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Tempat Lahir</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.birthPlace || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Tanggal Lahir</h3>
              <p className="mt-1 text-sm text-gray-900">{formatDate(resident.birthDate)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Agama</h3>
              <p className="mt-1 text-sm text-gray-900">{getOptionLabel(resident.religion, religionOptions)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status Perkawinan</h3>
              <p className="mt-1 text-sm text-gray-900">{getOptionLabel(resident.maritalStatus, maritalStatusOptions)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Pendidikan</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.education ? getOptionLabel(resident.education, educationOptions) : '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Pekerjaan</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.occupation || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Nomor BPJS</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.bpjsNumber || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status Vaksinasi</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.vaccinationStatus ? getOptionLabel(resident.vaccinationStatus, vaccinationStatusOptions) : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FiHome className="mr-2 text-green-500" /> Informasi Kontak & Domisili
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Alamat</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.address}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">RT/RW</h3>
              <p className="mt-1 text-sm text-gray-900">RT {resident.rtNumber}/RW {resident.rwNumber}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status Domisili</h3>
              <p className="mt-1 text-sm text-gray-900">{getOptionLabel(resident.domicileStatus, domicileStatusOptions)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Nomor HP</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.phoneNumber || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="mt-1 text-sm text-gray-900">{resident.email || '-'}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status Verifikasi</h3>
              <p className="mt-1">
                {resident.isVerified ? (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Terverifikasi
                  </span>
                ) : (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Belum Terverifikasi
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Family Members Card */}
      {familyMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FiUsers className="mr-2 text-purple-500" /> Anggota Keluarga
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NIK
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jenis Kelamin
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Lahir
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status dalam Keluarga
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {familyMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.nik}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.gender === Gender.LAKI_LAKI ? 'Laki-laki' : 'Perempuan'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.birthDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.familyRole ? getOptionLabel(member.familyRole, familyRoleOptions) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Update Request Modal */}
      {showUpdateRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ajukan Perubahan Data</h2>
                <button
                  onClick={() => {
                    setShowUpdateRequestModal(false);
                    setRequestSent(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {requestSent ? (
                <div className="text-center py-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-gray-900">Permintaan Terkirim</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Permintaan perubahan data Anda telah terkirim. Pengurus RT/RW akan meninjau permintaan ini.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateRequest();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Data yang ingin diubah
                    </label>
                    <select
                      value={updateRequest.field}
                      onChange={(e) => setUpdateRequest({ ...updateRequest, field: e.target.value })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Pilih data</option>
                      <option value="fullName">Nama Lengkap</option>
                      <option value="phoneNumber">Nomor HP</option>
                      <option value="email">Email</option>
                      <option value="occupation">Pekerjaan</option>
                      <option value="education">Pendidikan</option>
                      <option value="maritalStatus">Status Perkawinan</option>
                      <option value="vaccinationStatus">Status Vaksinasi</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nilai baru
                    </label>
                    <input
                      type="text"
                      value={updateRequest.newValue}
                      onChange={(e) => setUpdateRequest({ ...updateRequest, newValue: e.target.value })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Masukkan nilai baru"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Alasan perubahan
                    </label>
                    <textarea
                      value={updateRequest.reason}
                      onChange={(e) => setUpdateRequest({ ...updateRequest, reason: e.target.value })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      rows={3}
                      placeholder="Berikan alasan perubahan data"
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowUpdateRequestModal(false)}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Kirim Permintaan
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 