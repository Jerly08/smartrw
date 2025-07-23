'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { documentApi } from '@/lib/api';
import { DocumentType, DocumentStatus, documentTypeOptions, documentStatusOptions } from '@/lib/types/document';
import { FiAlertCircle, FiDownload } from 'react-icons/fi';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DocumentStatistics {
  total: number;
  diajukan: number;
  diproses: number;
  disetujui: number;
  ditandatangani: number;
  selesai: number;
  ditolak: number;
  byType: {
    [key in DocumentType]: number;
  };
  byMonth: {
    month: string;
    count: number;
  }[];
  processingTime: {
    average: number;
    min: number;
    max: number;
  };
  byRT: {
    rtNumber: string;
    count: number;
  }[];
}

export default function DocumentStatisticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [statistics, setStatistics] = useState<DocumentStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const isAdmin = user?.role === 'ADMIN';
  const isRW = user?.role === 'RW';

  useEffect(() => {
    if (!loading && user) {
      if (!isAdmin && !isRW) {
        // Redirect non-admin/RW users
        router.push('/dashboard');
        return;
      }
      
      fetchStatistics();
    }
  }, [user, loading, router, dateRange]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      // This would be replaced with an actual API call when implemented
      // const response = await documentApi.getDocumentStatistics({
      //   startDate: dateRange.startDate,
      //   endDate: dateRange.endDate,
      // });
      // setStatistics(response);
      
      // Placeholder data for UI development
      setStatistics({
        total: 120,
        diajukan: 15,
        diproses: 25,
        disetujui: 10,
        ditandatangani: 5,
        selesai: 50,
        ditolak: 15,
        byType: {
          [DocumentType.DOMISILI]: 40,
          [DocumentType.PENGANTAR_SKCK]: 25,
          [DocumentType.TIDAK_MAMPU]: 20,
          [DocumentType.USAHA]: 15,
          [DocumentType.KELAHIRAN]: 10,
          [DocumentType.KEMATIAN]: 5,
          [DocumentType.PINDAH]: 3,
          [DocumentType.LAINNYA]: 2,
        },
        byMonth: [
          { month: 'Jan', count: 12 },
          { month: 'Feb', count: 15 },
          { month: 'Mar', count: 10 },
          { month: 'Apr', count: 18 },
          { month: 'May', count: 20 },
          { month: 'Jun', count: 25 },
          { month: 'Jul', count: 20 },
        ],
        processingTime: {
          average: 3.5, // days
          min: 1,
          max: 7,
        },
        byRT: [
          { rtNumber: '001', count: 25 },
          { rtNumber: '002', count: 35 },
          { rtNumber: '003', count: 20 },
          { rtNumber: '004', count: 15 },
          { rtNumber: '005', count: 25 },
        ],
      });
    } catch (error) {
      console.error('Error fetching document statistics:', error);
      setError('Gagal memuat statistik dokumen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportStatistics = async () => {
    try {
      // This would be replaced with an actual API call when implemented
      // await documentApi.exportDocumentStatistics({
      //   startDate: dateRange.startDate,
      //   endDate: dateRange.endDate,
      // });
      alert('Statistik berhasil diunduh');
    } catch (error) {
      console.error('Error exporting statistics:', error);
      setError('Gagal mengunduh statistik');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value,
    });
  };

  // Prepare chart data
  const statusChartData = {
    labels: ['Diajukan', 'Diproses', 'Disetujui', 'Ditandatangani', 'Selesai', 'Ditolak'],
    datasets: [
      {
        label: 'Jumlah Dokumen',
        data: statistics ? [
          statistics.diajukan,
          statistics.diproses,
          statistics.disetujui,
          statistics.ditandatangani,
          statistics.selesai,
          statistics.ditolak,
        ] : [],
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)', // yellow
          'rgba(54, 162, 235, 0.6)', // blue
          'rgba(75, 192, 192, 0.6)', // teal
          'rgba(153, 102, 255, 0.6)', // purple
          'rgba(75, 192, 75, 0.6)', // green
          'rgba(255, 99, 132, 0.6)', // red
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(75, 192, 75, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const typeChartData = {
    labels: documentTypeOptions.map(option => option.label),
    datasets: [
      {
        label: 'Jumlah Dokumen',
        data: statistics ? documentTypeOptions.map(option => statistics.byType[option.value] || 0) : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const monthlyChartData = {
    labels: statistics?.byMonth.map(item => item.month) || [],
    datasets: [
      {
        label: 'Jumlah Dokumen',
        data: statistics?.byMonth.map(item => item.count) || [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const rtChartData = {
    labels: statistics?.byRT.map(item => `RT ${item.rtNumber}`) || [],
    datasets: [
      {
        label: 'Jumlah Dokumen',
        data: statistics?.byRT.map(item => item.count) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (!isAdmin && !isRW) {
    return null; // Prevent rendering for unauthorized users
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Statistik Dokumen</h1>
        <button
          onClick={handleExportStatistics}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FiDownload className="mr-2" /> Unduh Laporan
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchStatistics}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : statistics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Dokumen</div>
              <div className="text-3xl font-bold">{statistics.total}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Dokumen Selesai</div>
              <div className="text-3xl font-bold">{statistics.selesai}</div>
              <div className="text-sm text-gray-500 mt-1">
                {((statistics.selesai / statistics.total) * 100).toFixed(1)}% dari total
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500">Rata-rata Waktu Proses</div>
              <div className="text-3xl font-bold">{statistics.processingTime.average} hari</div>
              <div className="text-sm text-gray-500 mt-1">
                Min: {statistics.processingTime.min} hari, Max: {statistics.processingTime.max} hari
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Distribusi Status</h2>
              <div className="h-64">
                <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>

            {/* Document Types */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Jenis Dokumen</h2>
              <div className="h-64">
                <Bar 
                  data={typeChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      x: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tren Bulanan</h2>
              <div className="h-64">
                <Line 
                  data={monthlyChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </div>

            {/* RT Distribution */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Distribusi per RT</h2>
              <div className="h-64">
                <Bar 
                  data={rtChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          Tidak ada data statistik yang tersedia
        </div>
      )}
    </div>
  );
} 