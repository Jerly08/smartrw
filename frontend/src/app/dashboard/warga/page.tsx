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
import { FiSearch, FiUserPlus, FiFilter, FiDownload, FiUpload, FiCheck, FiX, FiHome, FiEdit3, FiPlus, FiInfo } from 'react-icons/fi';
import { residentApi, rtApi, rwApi } from '@/lib/api';
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
      className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${widthClass} ${className}`}
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

// Inline Input component with proper typing
const Input = React.forwardRef<HTMLInputElement, {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  className?: string;
  [key: string]: any;
}>(({ label, error, fullWidth = true, className = '', ...props }, ref) => {
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

// RW Management component
const RWManagement = ({ onClose }: { onClose: () => void }) => {
  const [activeView, setActiveView] = useState<'list' | 'form'>('list');
  const [editingRW, setEditingRW] = useState<RTItem | null>(null);
  const [isRWFormLoading, setIsRWFormLoading] = useState(false);
  const [rwList, setRwList] = useState<RTItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  useEffect(() => {
    fetchRWList();
  }, []);

  const fetchRWList = async () => {
    setIsLoadingList(true);
    try {
      const result = await rwApi.getAllRWUsers();
      setRwList(result.rwUsers || []);
    } catch (error) {
      console.error('Error fetching RW list:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleRWSubmit = async (data: any) => {
    setIsRWFormLoading(true);
    try {
      if (editingRW) {
        // Update existing RW
        await rwApi.updateRWUser(editingRW.id, data);
        toast.success('RW berhasil diperbarui');
      } else {
        // Create new RW
        const result = await rwApi.createRWUser(data);

        if (result.credentials) {
          toast.success(
            `RW berhasil ditambahkan!\n\nAkun Login RW:\nEmail: ${result.credentials.email}\nPassword: ${result.credentials.password}\n\nSimpan informasi ini dengan aman.`
          );
        } else {
          toast.success('RW berhasil ditambahkan');
        }
      }

      // Refresh RW list
      await fetchRWList();

      // Go back to list view
      setActiveView('list');
      setEditingRW(null);
    } catch (error: any) {
      console.error('Error saving RW:', error);
      toast.error('Tidak bisa menyimpan RW');
    } finally {
      setIsRWFormLoading(false);
    }
  };

  const handleRWCancel = () => {
    setActiveView('list');
    setEditingRW(null);
  };

  const handleAddRW = () => {
    setEditingRW(null);
    setActiveView('form');
  };

  const handleEditRW = (rw: RTItem) => {
    setEditingRW(rw);
    setActiveView('form');
  };

  const handleDeleteRW = async (rw: RTItem) => {
    if (confirm(`Apakah Anda yakin ingin menghapus RW ${rw.number}?`)) {
      try {
        await rwApi.deleteRWUser(rw.id);
        toast.success('RW berhasil dihapus');
        await fetchRWList();
      } catch (error) {
        console.error('Error deleting RW:', error);
        toast.error('Gagal menghapus RW');
      }
    }
  };

  if (activeView === 'form') {
    return (
      <RWForm
        rw={editingRW}
        onSubmit={handleRWSubmit}
        onCancel={handleRWCancel}
        isLoading={isRWFormLoading}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Daftar RW</h3>
        <Button onClick={handleAddRW}>
          <FiPlus className="mr-2 h-4 w-4" />
          Tambah RW
        </Button>
      </div>

      {isLoadingList ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : rwList.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor RW</TableHead>
                <TableHead>Nama RW</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rwList.map(rw => (
                <TableRow key={rw.id}>
                  <TableCell className="font-medium">RW {rw.number}</TableCell>
                  <TableCell>{rw.name || '-'}</TableCell>
                  <TableCell>{rw.isActive ? 'Aktif' : 'Tidak Aktif'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditRW(rw)}>
                      <FiEdit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteRW(rw)}
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
          <p className="mb-2">Belum ada RW yang terdaftar</p>
          <p className="text-sm mb-4">Mulai dengan menambahkan RW pertama</p>
          <Button onClick={handleAddRW}>
            <FiPlus className="mr-2 h-4 w-4" />
            Tambah RW
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
    } catch (error: any) {
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
            const validationErrors = error.response.data.errors.map((err: any) => {
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
            const issues = error.response.data.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
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
// RW Form component
const RWForm = ({ rw, onSubmit, onCancel, isLoading = false }: {
  rw?: RTItem | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: rw?.name || '',
    email: rw?.email || '',
    rwNumber: rw?.number || '',
    phoneNumber: rw?.phoneNumber || '',
    address: rw?.address || '',
    isActive: rw?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    // Name validation - required
    if (!formData.name.trim()) {
      newErrors.name = 'Nama RW wajib diisi';
    }
    
    // Email validation - required
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    // RW Number validation - required
    if (!formData.rwNumber.trim()) {
      newErrors.rwNumber = 'Nomor RW wajib diisi';
    }
    
    // Phone number validation - optional
    if (formData.phoneNumber.trim() && !/^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Format nomor telepon tidak valid (contoh: 08123456789)';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const cleanData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        rwNumber: formData.rwNumber.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        isActive: formData.isActive
      };
      
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
        label="Nama RW *"
        placeholder="Nama Lengkap RW"
        value={formData.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
        error={errors.name}
      />
      
      <Input
        label="Email *"
        type="email"
        placeholder="rw@example.com"
        value={formData.email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
        error={errors.email}
      />
      
      <Input
        label="Nomor RW *"
        placeholder="001"
        value={formData.rwNumber}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rwNumber', e.target.value)}
        error={errors.rwNumber}
      />
      
      <Input
        label="Nomor Telepon"
        placeholder="08123456789"
        value={formData.phoneNumber}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phoneNumber', e.target.value)}
        error={errors.phoneNumber}
      />
      
      <Input
        label="Alamat"
        placeholder="Alamat RW"
        value={formData.address}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('address', e.target.value)}
        error={errors.address}
      />
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('isActive', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          RW Aktif
        </label>
      </div>
      
      {/* Credentials Information */}
      {!rw && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">📝 Informasi Login RW</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Email:</strong> {formData.email || 'email@example.com'}</p>
            <p><strong>Password:</strong> RW{formData.rwNumber || 'XXX'}@2024</p>
            <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
              ℹ️ <strong>Catatan:</strong> Setelah RW dibuat, akun login akan otomatis dibuat dengan kredensial di atas. 
              RW dapat login ke sistem menggunakan email dan password ini untuk mengakses dashboard khusus RW.
            </div>
          </div>
        </div>
      )}
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Batal
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {rw ? 'Update RW' : 'Tambah RW'}
        </Button>
      </DialogFooter>
    </form>
  );
};

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
        if (cleanData[key as keyof typeof cleanData] === undefined || cleanData[key as keyof typeof cleanData] === '') {
          delete cleanData[key as keyof typeof cleanData];
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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('number', e.target.value)}
        error={errors.number}
        maxLength={3}
      />
      
      <Input
        label="Nama RT"
        placeholder="RT Mawar Indah"
        value={formData.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
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
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>
      
      <Input
        label="Alamat"
        placeholder="Jl. Mawar No. 1-50"
        value={formData.address}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('address', e.target.value)}
        error={errors.address}
      />
      
      <Input
        label="Ketua RT"
        placeholder="Nama Ketua RT"
        value={formData.chairperson}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('chairperson', e.target.value)}
        error={errors.chairperson}
      />
      
      <Input
        label="Nomor Telepon"
        placeholder="08123456789"
        value={formData.phoneNumber}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phoneNumber', e.target.value)}
        error={errors.phoneNumber}
      />
      
      <Input
        label="Email"
        type="email"
        placeholder="rt001@example.com"
        value={formData.email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
        error={errors.email}
      />
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('isActive', e.target.checked)}
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
  const [pendingVerifications, setPendingVerifications] = useState<Resident[]>([]);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRt, setSelectedRt] = useState('all');
  const [rtList, setRtList] = useState<RTItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setIsLoadingVerifications(true);

        // Get all residents
        const residentResponse = await residentApi.getAllResidents({ limit: 1000 });
        setResidents(residentResponse.residents || []);

        // If user is RT, get pending verifications
        if (user?.role === 'RT') {
          const pending = await residentApi.getPendingVerification();
          setPendingVerifications(pending);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Gagal memuat data warga');
      } finally {
        setIsLoading(false);
        setIsLoadingVerifications(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);
  
  // RT management states
  const [isRTModalOpen, setIsRTModalOpen] = useState(false);
  const [isRTFormLoading, setIsRTFormLoading] = useState(false);
  const [editingRT, setEditingRT] = useState<RTItem | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Management modal state (for both RW and RT management)
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  
  // Detail modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Resident[]>([]);
  const [isFamilyLoading, setIsFamilyLoading] = useState(false);

  // Document verification modal states
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedResidentForDocs, setSelectedResidentForDocs] = useState<Resident | null>(null);
  const [residentDocuments, setResidentDocuments] = useState<any[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);

  // Fetch data based on user role
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'ADMIN') {
          // ADMIN sees RW data only
          const rwResponse = await rwApi.getAllRWUsers();
          const transformedRWData = (rwResponse.rwUsers || []).map((rw: any) => ({
            id: rw.id,
            fullName: rw.name,
            nik: `RW${rw.number}000000000000`,
            noKK: `RW${rw.number}0000000000000000`,
            address: rw.address || `RW ${rw.number}`,
            rtNumber: rw.number,
            rwNumber: rw.number,
            familyRole: 'KEPALA_KELUARGA',
            isVerified: rw.isActive ?? true,
            phoneNumber: rw.phoneNumber || '',
            email: rw.email || ''
          }));
          setResidents(transformedRWData);
          setFilteredResidents(transformedRWData);
        } else if (user?.role === 'RW') {
          // RW sees RT data only
          const rtResponse = await rtApi.getAllRTs({ limit: 50 });
          const transformedRTData = (rtResponse.rts || []).map((rt: any) => ({
            id: rt.id,
            fullName: rt.name || `Ketua RT ${rt.number}`,
            nik: `RT${rt.number}000000000000`,
            noKK: `RT${rt.number}000000000000`,
            address: rt.address || `RT ${rt.number}`,
            rtNumber: rt.number,
            rwNumber: '000', // Default for RT
            familyRole: 'KEPALA_KELUARGA',
            isVerified: rt.isActive ?? true,
            phoneNumber: rt.phoneNumber || '',
            email: rt.email || ''
          }));
          setResidents(transformedRTData);
          setFilteredResidents(transformedRTData);
        } else {
          // Other roles see regular resident data
          const residentResponse = await residentApi.getAllResidents({
            page: 1,
            limit: 100
          });
          setResidents(residentResponse.residents || []);
          setFilteredResidents(residentResponse.residents || []);
        }
        
        // Fetch RT list for filtering (only needed for non-ADMIN roles)
        if (user?.role !== 'ADMIN') {
          await fetchRTList();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

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

  const handleVerifyResident = async (id: number, verify: boolean) => {
    try {
      if (user?.role === 'RT' && verify) {
        // Use RT-specific verification endpoint
        await residentApi.verifyResidentByRT(id);
        
        // Update local state
        setResidents(prevResidents => 
          prevResidents.map(resident => 
            resident.id === id ? { ...resident, isVerified: true } : resident
          )
        );
        
        // Also update pending verifications list
        setPendingVerifications(prev => prev.filter(resident => resident.id !== id));
        
        toast.success('Warga berhasil diverifikasi!');
      } else {
        // Use regular verification endpoint for other roles
        if (verify) {
          await residentApi.verifyResident(id);
        }
        
        setResidents(prevResidents => 
          prevResidents.map(resident => 
            resident.id === id ? { ...resident, isVerified: verify } : resident
          )
        );
        
        toast.success(`Data warga berhasil ${verify ? 'diverifikasi' : 'dibatalkan verifikasi'}`);
      }
    } catch (error) {
      console.error('Error verifying resident:', error);
      toast.error('Gagal memproses verifikasi warga');
    }
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

  // Document verification modal functions
  const openDocumentModal = async (resident: Resident) => {
    setSelectedResidentForDocs(resident);
    setIsDocumentModalOpen(true);
    setIsDocumentsLoading(true);
    
    // Reset documents first
    setResidentDocuments([]);

    try {
      // Fetch real documents from API instead of using mock data
      try {
        const documents = await residentApi.getResidentDocuments(resident.id);
        setResidentDocuments(documents || []);
      } catch (error) {
        // If API fails, show only KTP and KK documents without selfie
        const mockDocuments = [
          {
            id: 1,
            type: 'KTP',
            filename: 'ktp_' + resident.nik + '.jpg',
            uploadedAt: new Date().toISOString(),
            status: 'pending',
            fileUrl: `/api/uploads/residents/ktp_${resident.nik}.jpg`
          },
          {
            id: 2,
            type: 'KK',
            filename: 'kk_' + resident.noKK + '.jpg',
            uploadedAt: new Date().toISOString(),
            status: 'pending',
            fileUrl: `/api/uploads/residents/kk_${resident.noKK}.jpg`
          }
        ];
        setResidentDocuments(mockDocuments);
      }

      setIsDocumentsLoading(false);
      
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Gagal memuat dokumen warga');
      setResidentDocuments([]);
      setIsDocumentsLoading(false);
    }
  };

  const closeDocumentModal = () => {
    setIsDocumentModalOpen(false);
    setSelectedResidentForDocs(null);
    setResidentDocuments([]);
  };

  // Handle document viewing function
  const handleViewDocument = async (doc: any) => {
    try {
      // Try to fetch the actual document from the API
      const response = await fetch(doc.fileUrl);
      
      if (response.ok) {
        // If document exists, open it in a new tab
        window.open(doc.fileUrl, '_blank');
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error(`Dokumen ${doc.type} tidak dapat ditampilkan. File mungkin belum diunggah atau tidak tersedia.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Data Warga</h1>
        
        <div className="flex space-x-2">
{/* RW Management - Only for ADMIN role */}
          {user?.role === 'ADMIN' && (
            <Dialog open={isManagementModalOpen} onOpenChange={setIsManagementModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={() => setIsManagementModalOpen(true)}>
                  <FiUserPlus className="mr-2 h-4 w-4" />
                  Kelola RW
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manajemen RW</DialogTitle>
                </DialogHeader>
                <RWManagement onClose={() => setIsManagementModalOpen(false)} />
              </DialogContent>
            </Dialog>
          )}

          {user?.role === 'RW' && (
            <Dialog open={isManagementModalOpen} onOpenChange={setIsManagementModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" onClick={() => setIsManagementModalOpen(true)}>
                  <FiHome className="mr-2 h-4 w-4" />
                  Kelola RT
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manajemen RT</DialogTitle>
                </DialogHeader>
                <RTManagement onClose={() => setIsManagementModalOpen(false)} />
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
          
          <Tabs defaultValue={user?.role === 'RT' ? 'pending-verification' : 'all'} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {user?.role === 'RT' && (
                <TabsTrigger value="pending-verification">
                  Perlu Verifikasi ({pendingVerifications.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="kepala-keluarga">Kepala Keluarga</TabsTrigger>
              <TabsTrigger value="anggota-keluarga">Anggota Keluarga</TabsTrigger>
            </TabsList>
            
            {/* Tab for RT Pending Verifications */}
            {user?.role === 'RT' && (
              <TabsContent value="pending-verification">
                {isLoadingVerifications ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : pendingVerifications.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-orange-900 mb-2">⚠️ Verifikasi Diperlukan</h3>
                      <p className="text-sm text-orange-800">
                        Berikut adalah {pendingVerifications.length} warga yang memerlukan verifikasi RT. 
                        Silakan periksa data mereka dan klik "Verifikasi" jika data sudah sesuai.
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama</TableHead>
                            <TableHead>NIK</TableHead>
                            <TableHead>Alamat</TableHead>
                            <TableHead>Tanggal Daftar</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingVerifications.map((resident) => (
                            <TableRow key={resident.id}>
                              <TableCell className="font-medium">{resident.fullName}</TableCell>
                              <TableCell>{resident.nik}</TableCell>
                              <TableCell>{resident.address}</TableCell>
                              <TableCell>
                                {resident.createdAt ? new Date(resident.createdAt).toLocaleDateString('id-ID') : '-'}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => openDetailModal(resident)}>
                                  Detail
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => openDocumentModal(resident)}
                                >
                                  <FiInfo className="mr-1 h-4 w-4" />
                                  Info
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleVerifyResident(resident.id, true)}
                                >
                                  <FiCheck className="mr-1 h-4 w-4" />
                                  Verifikasi
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <div className="mb-4">
                      <FiCheck className="mx-auto h-12 w-12 text-green-300" />
                    </div>
                    <p className="mb-2">Tidak ada warga yang perlu diverifikasi</p>
                    <p className="text-sm">Semua warga di RT Anda sudah terverifikasi</p>
                  </div>
                )}
              </TabsContent>
            )}
            
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
                              <div className="space-y-1">
                                <Badge variant="success" className="bg-green-100 text-green-800">Terverifikasi</Badge>
                                <p className="text-xs text-gray-500">Dokumen lengkap</p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Belum Terverifikasi</Badge>
                                <p className="text-xs text-gray-500">Menunggu upload dokumen</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openDetailModal(resident)}>
                              Detail
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => openDocumentModal(resident)}
                            >
                              <FiInfo className="mr-1 h-4 w-4" />
                              Info
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => openDocumentModal(resident)}
                            >
                              <FiInfo className="mr-1 h-4 w-4" />
                              Info
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => openDocumentModal(resident)}
                            >
                              <FiInfo className="mr-1 h-4 w-4" />
                              Info
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

      {/* Document Verification Modal */}
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="sm:max-w-[700px]" aria-describedby="document-modal-description">
          <DialogHeader>
            <DialogTitle>Dokumen Verifikasi Warga</DialogTitle>
          </DialogHeader>
          <div id="document-modal-description" className="sr-only">
            Modal untuk menampilkan dokumen verifikasi warga
          </div>
          {isDocumentsLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : selectedResidentForDocs ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Informasi Warga</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Nama:</span> {selectedResidentForDocs.fullName}</div>
                  <div><span className="font-medium">NIK:</span> {selectedResidentForDocs.nik}</div>
                  <div><span className="font-medium">No. KK:</span> {selectedResidentForDocs.noKK}</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-semibold mb-3">Dokumen Terlampir</h4>
                {residentDocuments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jenis Dokumen</TableHead>
                          <TableHead>Nama File</TableHead>
                          <TableHead>Tanggal Upload</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {residentDocuments.map(doc => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.type}</TableCell>
                            <TableCell>{doc.filename}</TableCell>
                            <TableCell>{new Date(doc.uploadedAt).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewDocument(doc)}
                              >
                                Lihat Dokumen
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center p-4 text-gray-500">Tidak ada dokumen terlampir.</p>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={closeDocumentModal}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 