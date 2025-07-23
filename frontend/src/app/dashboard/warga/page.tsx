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
import toast from '@/components/ui/toast';
import { FiSearch, FiUserPlus, FiFilter, FiDownload, FiUpload, FiCheck, FiX } from 'react-icons/fi';

// Inline Button component
const Button = ({
  variant = 'default',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
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
};

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

// Mock data structure based on the Prisma schema
type Resident = {
  id: number;
  nik: string;
  noKK: string;
  fullName: string;
  gender: 'LAKI_LAKI' | 'PEREMPUAN';
  birthPlace: string;
  birthDate: string;
  address: string;
  rtNumber: string;
  rwNumber: string;
  religion: string;
  maritalStatus: string;
  occupation: string | null;
  education: string | null;
  bpjsNumber: string | null;
  phoneNumber: string | null;
  email: string | null;
  isVerified: boolean;
  domicileStatus: string;
}

export default function WargaManagementPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data for initial development
  useEffect(() => {
    // In a real application, this would be an API call
    const mockResidents: Resident[] = [
      {
        id: 1,
        nik: '1234567890123456',
        noKK: '1234567890123456',
        fullName: 'Budi Santoso',
        gender: 'LAKI_LAKI',
        birthPlace: 'Jakarta',
        birthDate: '1990-01-15',
        address: 'Jl. Mawar No. 10',
        rtNumber: '001',
        rwNumber: '002',
        religion: 'ISLAM',
        maritalStatus: 'KAWIN',
        occupation: 'Karyawan Swasta',
        education: 'S1',
        bpjsNumber: '123456789',
        phoneNumber: '081234567890',
        email: 'budi@example.com',
        isVerified: true,
        domicileStatus: 'TETAP'
      },
      {
        id: 2,
        nik: '2234567890123456',
        noKK: '1234567890123456',
        fullName: 'Siti Aminah',
        gender: 'PEREMPUAN',
        birthPlace: 'Jakarta',
        birthDate: '1992-05-20',
        address: 'Jl. Mawar No. 10',
        rtNumber: '001',
        rwNumber: '002',
        religion: 'ISLAM',
        maritalStatus: 'KAWIN',
        occupation: 'Ibu Rumah Tangga',
        education: 'SMA',
        bpjsNumber: '223456789',
        phoneNumber: '082234567890',
        email: null,
        isVerified: true,
        domicileStatus: 'TETAP'
      },
      {
        id: 3,
        nik: '3234567890123456',
        noKK: '3234567890123456',
        fullName: 'Ahmad Ridwan',
        gender: 'LAKI_LAKI',
        birthPlace: 'Bandung',
        birthDate: '1985-08-12',
        address: 'Jl. Anggrek No. 5',
        rtNumber: '001',
        rwNumber: '002',
        religion: 'ISLAM',
        maritalStatus: 'KAWIN',
        occupation: 'Wiraswasta',
        education: 'D3',
        bpjsNumber: null,
        phoneNumber: '083234567890',
        email: 'ahmad@example.com',
        isVerified: false,
        domicileStatus: 'TETAP'
      },
    ];
    
    setTimeout(() => {
      setResidents(mockResidents);
      setFilteredResidents(mockResidents);
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter residents based on search term and status
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
    
    setFilteredResidents(filtered);
  }, [searchTerm, statusFilter, residents]);

  const handleVerifyResident = (id: number, verify: boolean) => {
    // In a real application, this would be an API call
    setResidents(prevResidents => 
      prevResidents.map(resident => 
        resident.id === id ? { ...resident, isVerified: verify } : resident
      )
    );
    
    toast.success(`Data warga berhasil ${verify ? 'diverifikasi' : 'dibatalkan verifikasi'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Data Warga</h1>
        
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">
                <FiUserPlus className="mr-2 h-4 w-4" />
                Tambah Warga
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tambah Data Warga Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm text-gray-500">
                  Form tambah data warga akan ditampilkan di sini.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline">Batal</Button>
                <Button type="button">Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
          <CardTitle>Data Warga RT {user?.resident?.rtNumber || '001'}</CardTitle>
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
            </div>
          </div>
          
          <Tabs defaultValue="all">
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
                            <Button variant="ghost" size="sm">
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
              <div className="text-center p-8 text-gray-500">
                Filter kepala keluarga akan ditampilkan di sini.
              </div>
            </TabsContent>
            
            <TabsContent value="anggota-keluarga">
              <div className="text-center p-8 text-gray-500">
                Filter anggota keluarga akan ditampilkan di sini.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 