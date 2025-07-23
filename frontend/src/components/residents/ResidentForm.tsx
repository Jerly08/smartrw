import React, { useState, useEffect } from 'react';
import { residentApi } from '@/lib/api';
import { 
  Resident, 
  ResidentFormData,
  Gender,
  Religion,
  MaritalStatus,
  Education,
  DomicileStatus,
  VaccinationStatus,
  FamilyRole,
  genderOptions,
  religionOptions,
  maritalStatusOptions,
  educationOptions,
  domicileStatusOptions,
  vaccinationStatusOptions,
  familyRoleOptions
} from '@/lib/types/resident';

interface ResidentFormProps {
  resident: Resident | null; // Null for new resident, object for edit
  onSubmit: () => void;
  onCancel: () => void;
  isRtView?: boolean; // RT can only edit/verify limited fields
}

export default function ResidentForm({ resident, onSubmit, onCancel, isRtView = false }: ResidentFormProps) {
  const [formData, setFormData] = useState<ResidentFormData>({
    nik: '',
    noKK: '',
    fullName: '',
    gender: Gender.LAKI_LAKI,
    birthPlace: '',
    birthDate: '',
    address: '',
    rtNumber: '',
    rwNumber: '',
    religion: Religion.ISLAM,
    maritalStatus: MaritalStatus.BELUM_KAWIN,
    occupation: '',
    education: undefined,
    bpjsNumber: '',
    phoneNumber: '',
    email: '',
    domicileStatus: DomicileStatus.TETAP,
    vaccinationStatus: undefined,
    familyRole: undefined
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data from resident if editing
  useEffect(() => {
    if (resident) {
      setFormData({
        nik: resident.nik,
        noKK: resident.noKK,
        fullName: resident.fullName,
        gender: resident.gender,
        birthPlace: resident.birthPlace,
        birthDate: formatDateForInput(resident.birthDate),
        address: resident.address,
        rtNumber: resident.rtNumber,
        rwNumber: resident.rwNumber,
        religion: resident.religion,
        maritalStatus: resident.maritalStatus,
        occupation: resident.occupation || '',
        education: resident.education,
        bpjsNumber: resident.bpjsNumber || '',
        phoneNumber: resident.phoneNumber || '',
        email: resident.email || '',
        domicileStatus: resident.domicileStatus,
        vaccinationStatus: resident.vaccinationStatus,
        familyRole: resident.familyRole
      });
    }
  }, [resident]);

  // Format date from ISO to YYYY-MM-DD for input field
  const formatDateForInput = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  };

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (resident) {
        // Update existing resident
        // If RT view, only update allowed fields
        if (isRtView) {
          const rtUpdatableFields = {
            // Fields that RT can update
            phoneNumber: formData.phoneNumber,
            email: formData.email,
            occupation: formData.occupation,
            education: formData.education,
            vaccinationStatus: formData.vaccinationStatus,
            domicileStatus: formData.domicileStatus
          };
          await residentApi.updateResident(resident.id, rtUpdatableFields);
        } else {
          // Admin/RW can update all fields
          await residentApi.updateResident(resident.id, formData);
        }
      } else {
        // Create new resident (only Admin/RW can do this)
        await residentApi.createResident(formData);
      }
      onSubmit();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Determine which fields should be disabled based on user role and editing state
  const isFieldDisabled = (fieldName: keyof ResidentFormData) => {
    // If RT view, only certain fields are editable
    if (isRtView) {
      const rtEditableFields = ['phoneNumber', 'email', 'occupation', 'education', 'vaccinationStatus', 'domicileStatus'];
      return !rtEditableFields.includes(fieldName);
    }
    
    // If editing (Admin/RW), certain fields are not editable (e.g. NIK)
    if (resident) {
      const nonEditableFieldsWhenUpdating = ['nik', 'noKK'];
      return nonEditableFieldsWhenUpdating.includes(fieldName);
    }
    
    return false;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Informasi Pribadi</h3>
          
          <div>
            <label htmlFor="nik" className="block text-sm font-medium text-gray-700">
              NIK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nik"
              id="nik"
              value={formData.nik}
              onChange={handleChange}
              disabled={isFieldDisabled('nik')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('nik')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>
          
          <div>
            <label htmlFor="noKK" className="block text-sm font-medium text-gray-700">
              Nomor KK <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="noKK"
              id="noKK"
              value={formData.noKK}
              onChange={handleChange}
              disabled={isFieldDisabled('noKK')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('noKK')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>
          
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isFieldDisabled('fullName')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('fullName')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>
          
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={isFieldDisabled('gender')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('gender')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            >
              {genderOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700">
              Tempat Lahir <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="birthPlace"
              id="birthPlace"
              value={formData.birthPlace}
              onChange={handleChange}
              disabled={isFieldDisabled('birthPlace')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('birthPlace')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>
          
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
              Tanggal Lahir <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="birthDate"
              id="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              disabled={isFieldDisabled('birthDate')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('birthDate')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>
          
          <div>
            <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
              Agama <span className="text-red-500">*</span>
            </label>
            <select
              id="religion"
              name="religion"
              value={formData.religion}
              onChange={handleChange}
              disabled={isFieldDisabled('religion')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('religion')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            >
              {religionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
              Status Perkawinan <span className="text-red-500">*</span>
            </label>
            <select
              id="maritalStatus"
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              disabled={isFieldDisabled('maritalStatus')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('maritalStatus')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            >
              {maritalStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact and Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Informasi Kontak & Tambahan</h3>
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Alamat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={formData.address}
              onChange={handleChange}
              disabled={isFieldDisabled('address')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('address')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rtNumber" className="block text-sm font-medium text-gray-700">
                RT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rtNumber"
                id="rtNumber"
                value={formData.rtNumber}
                onChange={handleChange}
                disabled={isFieldDisabled('rtNumber')}
                className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                  isFieldDisabled('rtNumber')
                    ? 'bg-gray-100 border border-gray-300 text-gray-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
            </div>
            <div>
              <label htmlFor="rwNumber" className="block text-sm font-medium text-gray-700">
                RW <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="rwNumber"
                id="rwNumber"
                value={formData.rwNumber}
                onChange={handleChange}
                disabled={isFieldDisabled('rwNumber')}
                className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                  isFieldDisabled('rwNumber')
                    ? 'bg-gray-100 border border-gray-300 text-gray-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Nomor HP
            </label>
            <input
              type="text"
              name="phoneNumber"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
              Pekerjaan
            </label>
            <input
              type="text"
              name="occupation"
              id="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="education" className="block text-sm font-medium text-gray-700">
              Pendidikan
            </label>
            <select
              id="education"
              name="education"
              value={formData.education || ''}
              onChange={handleChange}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Pilih Pendidikan</option>
              {educationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="domicileStatus" className="block text-sm font-medium text-gray-700">
              Status Domisili <span className="text-red-500">*</span>
            </label>
            <select
              id="domicileStatus"
              name="domicileStatus"
              value={formData.domicileStatus}
              onChange={handleChange}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {domicileStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="vaccinationStatus" className="block text-sm font-medium text-gray-700">
              Status Vaksinasi
            </label>
            <select
              id="vaccinationStatus"
              name="vaccinationStatus"
              value={formData.vaccinationStatus || ''}
              onChange={handleChange}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Pilih Status Vaksinasi</option>
              {vaccinationStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {!isRtView && (
            <div>
              <label htmlFor="familyRole" className="block text-sm font-medium text-gray-700">
                Status dalam Keluarga
              </label>
              <select
                id="familyRole"
                name="familyRole"
                value={formData.familyRole || ''}
                onChange={handleChange}
                disabled={isFieldDisabled('familyRole')}
                className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                  isFieldDisabled('familyRole')
                    ? 'bg-gray-100 border border-gray-300 text-gray-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                <option value="">Pilih Status dalam Keluarga</option>
                {familyRoleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label htmlFor="bpjsNumber" className="block text-sm font-medium text-gray-700">
              Nomor BPJS
            </label>
            <input
              type="text"
              name="bpjsNumber"
              id="bpjsNumber"
              value={formData.bpjsNumber}
              onChange={handleChange}
              disabled={isFieldDisabled('bpjsNumber')}
              className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                isFieldDisabled('bpjsNumber')
                  ? 'bg-gray-100 border border-gray-300 text-gray-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Menyimpan...
            </>
          ) : resident ? (
            isRtView ? 'Perbarui & Verifikasi' : 'Perbarui Data'
          ) : (
            'Simpan Data'
          )}
        </button>
      </div>
    </form>
  );
} 