import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiEdit,
  FiTrash2,
  FiCheck,
  FiX,
  FiInfo,
  FiBarChart2,
  FiHome
} from 'react-icons/fi';
import { residentApi } from '@/lib/api';
import {
  Resident,
  ResidentFilter,
  ResidentPagination,
  Gender,
  DomicileStatus,
  genderOptions,
  domicileStatusOptions
} from '@/lib/types/resident';
import ResidentForm from './ResidentForm';
import ImportResidentsModal from './ImportResidentsModal';

export default function AdminResidentManagement() {
  // State management
  const [residents, setResidents] = useState<Resident[]>([]);
  const [pagination, setPagination] = useState<ResidentPagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<ResidentFilter>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [rtOptions, setRtOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch residents data
  const fetchResidents = async () => {
    setLoading(true);
    try {
      const data = await residentApi.getAllResidents({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setResidents(data.residents);
      setPagination({
        ...pagination,
        totalItems: data.totalItems,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch resident statistics
  const fetchStatistics = async () => {
    try {
      const stats = await residentApi.getResidentStatistics();
      setStatistics(stats);
      
      // Extract RT options from statistics
      if (stats.byRT) {
        const options = stats.byRT.map((rt: any) => ({
          value: rt.rtNumber,
          label: `RT ${rt.rtNumber}`,
        }));
        setRtOptions(options);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Initial data loading
  useEffect(() => {
    fetchResidents();
    fetchStatistics();
  }, [pagination.page, pagination.limit]);

  // Apply filters
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchResidents();
  };

  const resetFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchResidents();
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle resident editing
  const handleEditResident = async (resident: Resident) => {
    setEditingResident(resident);
    setShowForm(true);
  };

  const handleDeleteResident = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      try {
        await residentApi.deleteResident(id);
        fetchResidents();
      } catch (error) {
        console.error('Error deleting resident:', error);
      }
    }
  };

  const handleVerifyResident = async (id: number) => {
    try {
      await residentApi.verifyResident(id);
      fetchResidents();
    } catch (error) {
      console.error('Error verifying resident:', error);
    }
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    setShowForm(false);
    setEditingResident(null);
    fetchResidents();
  };

  // Handle import/export
  const handleExport = () => {
    residentApi.exportResidents(filters);
  };

  const handleImport = async () => {
    setShowImportModal(false);
    fetchResidents();
    fetchStatistics();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Manajemen Data Warga</h1>
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <FiUserPlus className="mr-2" /> Tambah Warga
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            <FiUpload className="mr-2" /> Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            <FiDownload className="mr-2" /> Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-600">Total Warga</h3>
              <FiUsers className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{statistics.total}</p>
            <div className="mt-2 text-sm text-gray-600">
              <span className="text-green-600 font-medium">{statistics.verifiedPercentage}%</span> terverifikasi
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-600">Jumlah KK</h3>
              <FiHome className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{statistics.totalFamilies}</p>
            <div className="mt-2 text-sm text-gray-600">
              Rata-rata {statistics.averageFamilySize} anggota per KK
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-600">Demografi</h3>
              <FiBarChart2 className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm">Laki-laki</div>
                <div className="text-xl font-semibold">{statistics.maleCount}</div>
              </div>
              <div>
                <div className="text-sm">Perempuan</div>
                <div className="text-xl font-semibold">{statistics.femaleCount}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-600">Status Domisili</h3>
              <FiInfo className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <div>Tetap: {statistics.byDomicileStatus?.TETAP || 0}</div>
              <div>Kontrak: {statistics.byDomicileStatus?.KONTRAK || 0}</div>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <div>Kost: {statistics.byDomicileStatus?.KOST || 0}</div>
              <div>Lainnya: {statistics.byDomicileStatus?.LAINNYA || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <FiFilter className="mr-2" /> Filter
          </h2>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reset
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pencarian
            </label>
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="NIK, Nama, No. KK"
                value={filters.search || ''}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md pl-10"
              />
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RT
            </label>
            <select
              name="rtNumber"
              value={filters.rtNumber || ''}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Semua RT</option>
              {rtOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Verifikasi
            </label>
            <select
              name="isVerified"
              value={filters.isVerified === undefined ? '' : String(filters.isVerified)}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Semua</option>
              <option value="true">Terverifikasi</option>
              <option value="false">Belum Terverifikasi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Kelamin
            </label>
            <select
              name="gender"
              value={filters.gender || ''}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Semua</option>
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Domisili
            </label>
            <select
              name="domicileStatus"
              value={filters.domicileStatus || ''}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Semua</option>
              {domicileStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </div>

      {/* Residents Table */}
      <div className="bg-white p-4 rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold mb-4">Data Warga</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : residents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Tidak ada data warga yang sesuai dengan filter</p>
          </div>
        ) : (
          <>
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
                      RT/RW
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {residents.map((resident) => (
                    <tr key={resident.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {resident.nik}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resident.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resident.gender === Gender.LAKI_LAKI ? 'Laki-laki' : 'Perempuan'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(resident.birthDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        RT {resident.rtNumber}/RW {resident.rwNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {resident.isVerified ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Belum Terverifikasi
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditResident(resident)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteResident(resident.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus"
                          >
                            <FiTrash2 />
                          </button>
                          {!resident.isVerified && (
                            <button
                              onClick={() => handleVerifyResident(resident.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Verifikasi"
                            >
                              <FiCheck />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Menampilkan {residents.length} dari {pagination.totalItems} data warga
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Prev
                </button>
                <div className="px-3 py-1 text-gray-700">
                  {pagination.page} / {pagination.totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-3 py-1 rounded ${
                    pagination.page === pagination.totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Resident Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingResident ? 'Edit Data Warga' : 'Tambah Warga Baru'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingResident(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              <ResidentForm
                resident={editingResident}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingResident(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportResidentsModal
          onClose={() => setShowImportModal(false)}
          onImportSuccess={handleImport}
        />
      )}
    </div>
  );
} 