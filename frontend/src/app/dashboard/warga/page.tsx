'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { FiSearch, FiUserPlus, FiFilter, FiDownload, FiUpload, FiCheck, FiX, FiHome, FiEdit3, FiPlus } from 'react-icons/fi';
import { residentApi, rtApi } from '@/lib/api';
import ResidentForm from '@/components/residents/ResidentForm';
import { Resident } from '@/lib/types/resident';

// Inline Button component with forwardRef
const Button = React.forwardRef<HTMLButtonElement, {
  variant?: 'default' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}>(({
  variant = 'default',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    ghost: 'bg-transparent hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 py-2 px-4',
    lg: 'h-12 px-6 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Memproses...
        </>
      ) : (
        children
      )}
    </button>
  );
});
Button.displayName = 'Button';

// Inline Input component
const Input = React.forwardRef(
  ({ label, error, fullWidth = true, className = '', ...props }, ref) => {
    const inputClasses = `
      px-3 py-2 rounded-md border
      ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
      focus:outline-none focus:ring-2 focus:ring-opacity-50
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Type for RT list
type RTItem = {
  id: number;
  number: string;
  name?: string;
  description?: string;
  address?: string;
  chairperson?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
  _count?: {
    residents: number;
    families: number;
  };
};

// RT Management component
const RTManagement = ({ onClose }: { onClose: () => void }) => {
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [editingRT, setEditingRT] = useState<RTItem | null>(null);
  const [isRTFormLoading, setIsRTFormLoading] = useState(false);
  const [rtList, setRtList] = useState<RTItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  useEffect(() => {
    fetchRTList();
  }, []);

  const fetchRTList = async () => {
    setIsLoadingList(true);
    try {
      const result = await rtApi.getAllRTs({ limit: 50 });
      setRtList(result.rts || []);
    } catch (error) {
      console.error('Error fetching RT list:', error);
      // Use fallback data if API fails
      const fallbackRtList = [
        { id: 1, number: '001' },
        { id: 2, number: '002' },
        { id: 3, number: '003' }
      ];
      setRtList(fallbackRtList);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleRTSubmit = async (data: any) => {
    setIsRTFormLoading(true);
    try {
      if (editingRT) {
        // Update existing RT
        await rtApi.updateRT(editingRT.id, data);
        toast.success('RT berhasil diperbarui');
      } else {
        // Create new RT
        const result = await rtApi.createRT(data);
        
        // Show success message with credentials
        if (result.credentials) {
          toast.success(
            `RT berhasil ditambahkan!\n\nAkun Login RT:\nEmail: ${result.credentials.email}\nPassword: ${result.credentials.password}\n\nSimpan informasi ini dengan aman.`
          );
          
          // Optional: Show modal with credentials
          alert(
            `RT ${data.number} berhasil dibuat!\n\n` +
            `Akun Login RT telah dibuat:\n` +
            `Email: ${result.credentials.email}\n` +
            `Password: ${result.credentials.password}\n\n` +
            `RT sekarang dapat login dengan akun ini untuk mengakses halaman khusus RT.`
          );
        } else {
          toast.success('RT berhasil ditambahkan');
        }
      }
      
      // Refresh RT list
      await fetchRTList();
      
      // Go back to list view
      setActiveView('list');
      setEditingRT(null);
    } catch (error) {
      console.error('Error saving RT:', error);
      
      // Enhanced error handling to show backend validation messages
      let errorMessage = editingRT ? 'Gagal memperbarui RT' : 'Gagal menambahkan RT';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        if (error.response.status === 400 && error.response.data) {
          // Backend validation error
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
            // Backend validation errors array
            const validationErrors = error.response.data.errors.map(err => {
              if (typeof err === 'string') {
                return err;
              } else if (err.message) {
                return err.field ? `${err.field}: ${err.message}` : err.message;
              } else if (err.path && err.message) {
                return `${err.path.join('.')}: ${err.message}`;
              }
              return JSON.stringify(err);
            }).join('\n');
            errorMessage = `Validation errors:\n${validationErrors}`;
          } else if (error.response.data.issues) {
            // Zod validation errors
            const issues = error.response.data.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n');
            errorMessage = `Validation errors:\n${issues}`;
          }
        } else if (error.response.status === 401) {
          errorMessage = 'Unauthorized: Please check your login credentials';
        } else if (error.response.status === 403) {
          errorMessage = 'Forbidden: You do not have permission to perform this action';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'Network error: No response from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = `Request error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsRTFormLoading(false);
    }
  };

  const handleRTCancel = () => {
    setActiveView('list');
    setEditingRT(null);
  };

  const handleAddRT = () => {
    setEditingRT(null);
    setActiveView('form');
  };

  const handleEditRT = (rt: RTItem) => {
    setEditingRT(rt);
    setActiveView('form');
  };

  const handleDeleteRT = async (rt: RTItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus RT ${rt.number}?`)) {
      try {
        await rtApi.deleteRT(rt.id);
        toast.success('RT berhasil dihapus');
        await fetchRTList();
      } catch (error) {
        console.error('Error deleting RT:', error);
        toast.error('Gagal menghapus RT');
      }
    }
  };

  if (activeView === 'form') {
    return (
      <RTForm 
        rt={editingRT}
        onSubmit={handleRTSubmit}
        onCancel={handleRTCancel}
        isLoading={isRTFormLoading}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Daftar RT</h3>
        <Button onClick={handleAddRT}>
          <FiPlus className="mr-2 h-4 w-4" />
          Tambah RT
        </Button>
      </div>
      
      {isLoadingList ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : rtList.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor RT</TableHead>
                <TableHead>Nama RT</TableHead>
                <TableHead>Ketua RT</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jumlah Warga</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rtList.map((rt) => (
                <TableRow key={rt.id}>
                  <TableCell className="font-medium">RT {rt.number}</TableCell>
                  <TableCell>{rt.name || '-'}</TableCell>
                  <TableCell>{rt.chairperson || '-'}</TableCell>
                  <TableCell>
                    {rt.isActive ? (
                      <Badge variant="success" className="bg-green-100 text-green-800">Aktif</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-800">Tidak Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell>{rt._count?.residents || 0} warga</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditRT(rt)}>
                      <FiEdit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteRT(rt)}
                    >
                      <FiX className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          <div className="mb-4">
            <FiHome className="mx-auto h-12 w-12 text-gray-300" />
          </div>
          <p className="mb-2">Belum ada RT yang terdaftar</p>
          <p className="text-sm mb-4">Mulai dengan menambahkan RT pertama</p>
          <Button onClick={handleAddRT}>
            <FiPlus className="mr-2 h-4 w-4" />
            Tambah RT
          </Button>
        </div>
      )}
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
      </DialogFooter>
    </div>
  );
};

// RT Form component
const RTForm = ({ rt, onSubmit, onCancel, isLoading = false }: {
  rt?: RTItem | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) => {
  const [formData, setFormData] = useState({
    number: rt?.number || '',
    name: rt?.name || '',
    description: rt?.description || '',
    address: rt?.address || '',
    chairperson: rt?.chairperson || '',
    phoneNumber: rt?.phoneNumber || '',
    email: rt?.email || '',
    isActive: rt?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation to match backend schema
    const newErrors: Record<string, string> = {};
    
    // Number validation - required, 3-digit string
    if (!formData.number.trim()) {
      newErrors.number = 'Nomor RT wajib diisi';
    } else if (!/^[0-9]{3}$/.test(formData.number)) {
      newErrors.number = 'Nomor RT harus 3 digit angka (contoh: 001)';
    }
    
    // Name validation - optional, min 3 chars if provided
    if (formData.name.trim() && formData.name.trim().length < 3) {
      newErrors.name = 'Nama RT minimal 3 karakter';
    }
    
    // Description validation - optional, max 500 chars if provided
    if (formData.description.trim() && formData.description.trim().length > 500) {
      newErrors.description = 'Deskripsi maksimal 500 karakter';
    }
    
    // Address validation - optional, min 10 chars if provided
    if (formData.address.trim() && formData.address.trim().length < 10) {
      newErrors.address = 'Alamat minimal 10 karakter';
    }
    
    // Chairperson validation - optional, min 3 chars if provided
    if (formData.chairperson.trim() && formData.chairperson.trim().length < 3) {
      newErrors.chairperson = 'Nama ketua RT minimal 3 karakter';
    }
    
    // Phone number validation - optional, Indonesian phone format if provided
    if (formData.phoneNumber.trim() && !/^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Format nomor telepon tidak valid (contoh: 08123456789)';
    }
    
    // Email validation - optional, valid email format if provided
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // Clean up data before sending to API
      const cleanData = {
        number: formData.number.trim(),
        name: formData.name.trim() || undefined,
        description: formData.description.trim() || undefined,
        address: formData.address.trim() || undefined,
        chairperson: formData.chairperson.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        email: formData.email.trim() || undefined,
        isActive: formData.isActive
      };
      
      // Remove empty optional fields to avoid sending empty strings
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || cleanData[key] === '') {
          delete cleanData[key];
        }
      });
      
      onSubmit(cleanData);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nomor RT *"
        placeholder="001"
        value={formData.number}
        onChange={(e) => handleInputChange('number', e.target.value)}
        error={errors.number}
        maxLength={3}
      />
      
      <Input
        label="Nama RT"
        placeholder="RT Mawar Indah"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        error={errors.name}
      />
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Deskripsi
        </label>
        <textarea
          className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
            errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          rows={3}
          placeholder="Deskripsi RT..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>
      
      <Input
        label="Alamat"
        placeholder="Jl. Mawar No. 1-50"
        value={formData.address}
        onChange={(e) => handleInputChange('address', e.target.value)}
        error={errors.address}
      />
      
      <Input
        label="Ketua RT"
        placeholder="Nama Ketua RT"
        value={formData.chairperson}
        onChange={(e) => handleInputChange('chairperson', e.target.value)}
        error={errors.chairperson}
      />
      
      <Input
        label="Nomor Telepon"
        placeholder="08123456789"
        value={formData.phoneNumber}
        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
        error={errors.phoneNumber}
      />
      
      <Input
        label="Email"
        type="email"
        placeholder="rt001@example.com"
        value={formData.email}
        onChange={(e) => handleInputChange('email', e.target.value)}
        error={errors.email}
      />
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleInputChange('isActive', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          RT Aktif
        </label>
      </div>
      
      {/* Credentials Information */}
      {!rt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">📝 Informasi Login RT</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Email:</strong> {formData.email || `rt${formData.number || 'XXX'}@smartrw.local`}</p>
            <p><strong>Password:</strong> RT{formData.number || 'XXX'}@2024</p>
            <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
              ℹ️ <strong>Catatan:</strong> Setelah RT dibuat, akun login akan otomatis dibuat dengan kredensial di atas. 
              RT dapat login ke sistem menggunakan email dan password ini untuk mengakses dashboard khusus RT.
            </div>
          </div>
        </div>
      )}
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Batal
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {rt ? 'Update RT' : 'Tambah RT'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default function WargaManagementPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rtList, setRtList] = useState<RTItem[]>([]);
  const [selectedRt, setSelectedRt] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // RT management states
  const [isRTModalOpen, setIsRTModalOpen] = useState(false);
  const [isRTFormLoading, setIsRTFormLoading] = useState(false);
  const [editingRT, setEditingRT] = useState<RTItem | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Detail modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Resident[]>([]);
  const [isFamilyLoading, setIsFamilyLoading] = useState(false);

  // Fetch real data for residents and RT list
  useEffect(() => {
    const fetchData = async () => {
      try {
        const residentResponse = await residentApi.getAllResidents({
          page: 1,
          limit: 100
        });
        
        // Fetch RT list using API with fallback
        await fetchRTList();
        
        setResidents(residentResponse.residents || []);
        setFilteredResidents(residentResponse.residents || []);
      } catch (error) {
        console.error('Error fetching residents:', error);
        toast.error('Gagal memuat data warga');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter residents based on search term, status, selected RT, and active tab
  useEffect(() => {
    let filtered = [...residents];
    
    if (searchTerm) {
      filtered = filtered.filter(
        resident => 
          resident.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resident.nik.includes(searchTerm) ||
          resident.noKK.includes(searchTerm)
      );
    }
    
    if (statusFilter !== 'all') {
      const isVerified = statusFilter === 'verified';
      filtered = filtered.filter(resident => resident.isVerified === isVerified);
    }

    if (selectedRt !== 'all') {
      filtered = filtered.filter(resident => resident.rtNumber === selectedRt);
    }

    switch (activeTab) {
      case 'kepala-keluarga':
        filtered = filtered.filter(resident => resident.familyRole === 'KEPALA_KELUARGA');
        break;
      case 'anggota-keluarga':
        filtered = filtered.filter(resident => resident.familyRole !== 'KEPALA_KELUARGA');
        break;
      default:
        break;
    }

    setFilteredResidents(filtered);
  }, [searchTerm, statusFilter, selectedRt, activeTab, residents]);

  const handleVerifyResident = (id: number, verify: boolean) => {
    // In a real application, this would be an API call
    setResidents(prevResidents => 
      prevResidents.map(resident => 
        resident.id === id ? { ...resident, isVerified: verify } : resident
      )
    );
    
    toast.success(`Data warga berhasil ${verify ? 'diverifikasi' : 'dibatalkan verifikasi'}`);
  };

  const handleAddResidentSubmit = async () => {
    setIsAddModalOpen(false);
    // Refresh data after adding new resident
    try {
      const residentResponse = await residentApi.getAllResidents({
        page: 1,
        limit: 100
      });
      setResidents(residentResponse.residents || []);
      setFilteredResidents(residentResponse.residents || []);
      toast.success('Data warga berhasil ditambahkan');
    } catch (error) {
      console.error('Error refreshing residents:', error);
      toast.error('Gagal memuat ulang data warga');
    }
  };

  const handleAddResidentCancel = () => {
    setIsAddModalOpen(false);
  };

  // RT management functions
  const fetchRTList = async () => {
    try {
      const result = await rtApi.getAllRTs({ limit: 50 });
      setRtList(result.rts || []);
    } catch (error) {
      console.error('Error fetching RT list:', error);
      // Use fallback data if API fails
      const rtList = [
        { id: 1, number: '001' },
        { id: 2, number: '002' },
        { id: 3, number: '003' }
      ];
      setRtList(rtList);
    }
  };

  const handleRTSubmit = async (data: any) => {
    setIsRTFormLoading(true);
    try {
      if (editingRT) {
        // Update existing RT
        await rtApi.updateRT(editingRT.id, data);
        toast.success('RT berhasil diperbarui');
      } else {
        // Create new RT
        const result = await rtApi.createRT(data);
        
        // Show success message with credentials
        if (result.credentials) {
          toast.success(
            `RT berhasil ditambahkan!\n\nAkun Login RT:\nEmail: ${result.credentials.email}\nPassword: ${result.credentials.password}\n\nSimpan informasi ini dengan aman.`
          );
          
          // Optional: Show modal with credentials
          alert(
            `RT ${data.number} berhasil dibuat!\n\n` +
            `Akun Login RT telah dibuat:\n` +
            `Email: ${result.credentials.email}\n` +
            `Password: ${result.credentials.password}\n\n` +
            `RT sekarang dapat login dengan akun ini untuk mengakses halaman khusus RT.`
          );
        } else {
          toast.success('RT berhasil ditambahkan');
        }
      }
      
      // Refresh RT list
      await fetchRTList();
      
      // Close modal
      setIsRTModalOpen(false);
      setEditingRT(null);
    } catch (error) {
      console.error('Error saving RT:', error);
      toast.error(editingRT ? 'Gagal memperbarui RT' : 'Gagal menambahkan RT');
    } finally {
      setIsRTFormLoading(false);
    }
  };

  const handleRTCancel = () => {
    setIsRTModalOpen(false);
    setEditingRT(null);
  };

  // Detail modal functions
  const openDetailModal = async (resident: Resident) => {
    setSelectedResident(resident);
    setIsDetailModalOpen(true);
    setIsFamilyLoading(true);
    
    // Reset family members first
    setFamilyMembers([]);

    try {
      // Check if familyId is valid before making API call
      if (!resident.familyId || resident.familyId === null || resident.familyId === undefined) {
        console.warn('No valid familyId found for resident:', resident.id);
        toast.info('Tidak ada data keluarga untuk warga ini');
        setFamilyMembers([]);
        return;
      }
      
      const family = await residentApi.getFamilyMembers(resident.familyId);
      setFamilyMembers(family || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast.error('Gagal memuat data anggota keluarga');
      setFamilyMembers([]);
    } finally {
      setIsFamilyLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedResident(null);
    setFamilyMembers([]);
  };

  const openAddRTModal = () => {
    setEditingRT(null);
    setIsRTModalOpen(true);
  };

  const openEditRTModal = (rt: RTItem) => {
    setEditingRT(rt);
    setIsRTModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Data Warga</h1>
        
        <div className="flex space-x-2">
          {/* RT Management - Only for RW and ADMIN roles */}
          {(user?.role === 'RW' || user?.role === 'ADMIN') && (
            <Dialog open={isRTModalOpen} onOpenChange={setIsRTModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={openAddRTModal}>
                  <FiHome className="mr-2 h-4 w-4" />
                  Kelola RT
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manajemen RT</DialogTitle>
                </DialogHeader>
                <RTManagement onClose={() => setIsRTModalOpen(false)} />
              </DialogContent>
            </Dialog>
          )}

          <Button variant="outline">
            <FiUpload className="mr-2 h-4 w-4" />
            Import
          </Button>

          <Button variant="outline">
            <FiDownload className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Data Warga</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari nama, NIK, atau No. KK..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="verified">Terverifikasi</SelectItem>
                  <SelectItem value="unverified">Belum Terverifikasi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedRt} onValueChange={setSelectedRt}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih RT" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua RT</SelectItem>
                  {rtList.map(rt => (
                    <SelectItem key={rt.id} value={rt.number}>{`RT ${rt.number}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="kepala-keluarga">Kepala Keluarga</TabsTrigger>
              <TabsTrigger value="anggota-keluarga">Anggota Keluarga</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredResidents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>NIK</TableHead>
                        <TableHead>Nomor KK</TableHead>
                        <TableHead>Alamat</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResidents.map((resident) => (
                        <TableRow key={resident.id}>
                          <TableCell className="font-medium">{resident.fullName}</TableCell>
                          <TableCell>{resident.nik}</TableCell>
                          <TableCell>{resident.noKK}</TableCell>
                          <TableCell>{resident.address}</TableCell>
                          <TableCell>
                            {resident.isVerified ? (
                              <Badge variant="success" className="bg-green-100 text-green-800">Terverifikasi</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Belum Terverifikasi</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openDetailModal(resident)}>
                              Detail
                            </Button>
                            {!resident.isVerified ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleVerifyResident(resident.id, true)}
                              >
                                <FiCheck className="mr-1 h-4 w-4" />
                                Verifikasi
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleVerifyResident(resident.id, false)}
                              >
                                <FiX className="mr-1 h-4 w-4" />
                                Batal Verifikasi
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  Tidak ada data warga yang ditemukan.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="kepala-keluarga">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredResidents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>NIK</TableHead>
                        <TableHead>Nomor KK</TableHead>
                        <TableHead>Alamat</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResidents.map((resident) => (
                        <TableRow key={resident.id}>
                          <TableCell className="font-medium">{resident.fullName}</TableCell>
                          <TableCell>{resident.nik}</TableCell>
                          <TableCell>{resident.noKK}</TableCell>
                          <TableCell>{resident.address}</TableCell>
                          <TableCell>
                            {resident.isVerified ? (
                              <Badge variant="success" className="bg-green-100 text-green-800">Terverifikasi</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Belum Terverifikasi</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openDetailModal(resident)}>
                              Detail
                            </Button>
                            {!resident.isVerified ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleVerifyResident(resident.id, true)}
                              >
                                <FiCheck className="mr-1 h-4 w-4" />
                                Verifikasi
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleVerifyResident(resident.id, false)}
                              >
                                <FiX className="mr-1 h-4 w-4" />
                                Batal Verifikasi
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  Tidak ada data warga yang ditemukan.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="anggota-keluarga">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredResidents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>NIK</TableHead>
                        <TableHead>Nomor KK</TableHead>
                        <TableHead>Alamat</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResidents.map((resident) => (
                        <TableRow key={resident.id}>
                          <TableCell className="font-medium">{resident.fullName}</TableCell>
                          <TableCell>{resident.nik}</TableCell>
                          <TableCell>{resident.noKK}</TableCell>
                          <TableCell>{resident.address}</TableCell>
                          <TableCell>
                            {resident.isVerified ? (
                              <Badge variant="success" className="bg-green-100 text-green-800">Terverifikasi</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Belum Terverifikasi</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openDetailModal(resident)}>
                              Detail
                            </Button>
                            {!resident.isVerified ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleVerifyResident(resident.id, true)}
                              >
                                <FiCheck className="mr-1 h-4 w-4" />
                                Verifikasi
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleVerifyResident(resident.id, false)}
                              >
                                <FiX className="mr-1 h-4 w-4" />
                                Batal Verifikasi
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  Tidak ada data warga yang ditemukan.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby="detail-modal-description">
          <DialogHeader>
            <DialogTitle>Detail Keluarga</DialogTitle>
          </DialogHeader>
          <div id="detail-modal-description" className="sr-only">
            Modal untuk menampilkan detail informasi warga dan anggota keluarganya
          </div>
          {isFamilyLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : selectedResident ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Informasi Warga</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Nama:</span> {selectedResident.fullName}</div>
                  <div><span className="font-medium">NIK:</span> {selectedResident.nik}</div>
                  <div><span className="font-medium">No. KK:</span> {selectedResident.noKK}</div>
                  <div><span className="font-medium">Role:</span> {selectedResident.familyRole}</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-semibold mb-3">Anggota Keluarga</h4>
                {familyMembers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>NIK</TableHead>
                          <TableHead>Role Keluarga</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {familyMembers.map(member => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.fullName}</TableCell>
                            <TableCell>{member.nik}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {member.familyRole === 'KEPALA_KELUARGA' ? 'Kepala Keluarga' :
                                 member.familyRole === 'ISTRI' ? 'Istri' :
                                 member.familyRole === 'ANAK' ? 'Anak' :
                                 member.familyRole === 'ORANG_TUA' ? 'Orang Tua' :
                                 member.familyRole === 'MERTUA' ? 'Mertua' :
                                 member.familyRole === 'CUCU' ? 'Cucu' :
                                 member.familyRole === 'KEPONAKAN' ? 'Keponakan' :
                                 'Lainnya'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {member.isVerified ? (
                                <Badge variant="success" className="bg-green-100 text-green-800">Terverifikasi</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Belum Terverifikasi</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center p-4 text-gray-500">Tidak ada anggota keluarga lain ditemukan.</p>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={closeDetailModal}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 