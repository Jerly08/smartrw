'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { Phone, User, FileText, CheckCircle } from 'lucide-react';

// Validation schema
const completeProfileSchema = z.object({
  phoneNumber: z.string().min(10, 'Nomor telepon minimal 10 digit').optional().or(z.literal('')),
  occupation: z.string().min(2, 'Pekerjaan minimal 2 karakter').optional().or(z.literal('')),
  education: z.enum(['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3']).optional(),
  bpjsNumber: z.string().optional().or(z.literal('')),
  domicileStatus: z.enum(['TETAP', 'KONTRAK', 'KOST', 'LAINNYA']).optional(),
  vaccinationStatus: z.enum(['BELUM', 'DOSIS_1', 'DOSIS_2', 'BOOSTER_1', 'BOOSTER_2']).optional(),
});

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentData?: any;
}

const educationLabels = {
  'TIDAK_SEKOLAH': 'Tidak Sekolah',
  'SD': 'SD',
  'SMP': 'SMP',
  'SMA': 'SMA/SMK',
  'D1': 'Diploma 1',
  'D2': 'Diploma 2',
  'D3': 'Diploma 3',
  'S1': 'Sarjana (S1)',
  'S2': 'Magister (S2)',
  'S3': 'Doktor (S3)',
};

const domicileLabels = {
  'TETAP': 'Tetap',
  'KONTRAK': 'Kontrak',
  'KOST': 'Kost',
  'LAINNYA': 'Lainnya',
};

const vaccinationLabels = {
  'BELUM': 'Belum Vaksin',
  'DOSIS_1': 'Dosis 1',
  'DOSIS_2': 'Dosis 2',
  'BOOSTER_1': 'Booster 1',
  'BOOSTER_2': 'Booster 2',
};

export default function CompleteProfileModal({
  isOpen,
  onClose,
  onSuccess,
  currentData
}: CompleteProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    mode: 'onChange',
  });

  const watchedFields = watch();

  // Calculate completion percentage
  useEffect(() => {
    const fields = ['phoneNumber', 'occupation', 'education', 'bpjsNumber', 'domicileStatus', 'vaccinationStatus'];
    const filledFields = fields.filter(field => {
      const value = watchedFields[field as keyof CompleteProfileFormData];
      return value && value !== '';
    }).length;
    
    setCompletionPercentage(Math.round((filledFields / fields.length) * 100));
  }, [watchedFields]);

  // Set initial values when modal opens
  useEffect(() => {
    if (isOpen && currentData) {
      reset({
        phoneNumber: currentData.phoneNumber || '',
        occupation: currentData.occupation || '',
        education: currentData.education || undefined,
        bpjsNumber: currentData.bpjsNumber || '',
        domicileStatus: currentData.domicileStatus || undefined,
        vaccinationStatus: currentData.vaccinationStatus || undefined,
      });
    }
  }, [isOpen, currentData, reset]);

  const onSubmit = async (data: CompleteProfileFormData) => {
    setIsLoading(true);
    try {
      // Filter out empty strings and undefined values
      const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const response = await fetch('/api/residents/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(filteredData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Profil berhasil diperbarui!');
        onSuccess?.();
        onClose();
      } else {
        throw new Error(result.message || 'Gagal memperbarui profil');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldStatus = (fieldName: keyof CompleteProfileFormData) => {
    const value = watchedFields[fieldName];
    const hasCurrentValue = currentData && currentData[fieldName];
    const hasNewValue = value && value !== '';
    
    if (hasNewValue || hasCurrentValue) {
      return 'completed';
    }
    return 'empty';
  };

  const fieldItems = [
    {
      key: 'phoneNumber' as keyof CompleteProfileFormData,
      label: 'Nomor Telepon',
      icon: Phone,
      required: true,
    },
    {
      key: 'occupation' as keyof CompleteProfileFormData,
      label: 'Pekerjaan',
      icon: User,
      required: true,
    },
    {
      key: 'education' as keyof CompleteProfileFormData,
      label: 'Pendidikan',
      icon: FileText,
      required: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lengkapi Profil Anda</DialogTitle>
          <DialogDescription>
            Lengkapi data profil untuk mendapatkan akses penuh ke layanan Smart RW
          </DialogDescription>
        </DialogHeader>

        {/* Progress Card */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Progress Kelengkapan</CardTitle>
              <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                {completionPercentage}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    completionPercentage === 100 
                      ? 'bg-green-500' 
                      : completionPercentage >= 50 
                        ? 'bg-blue-500' 
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Belum lengkap</span>
                <span>{completionPercentage === 100 ? 'Lengkap!' : 'Sedang mengisi'}</span>
                <span>Selesai</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Required Fields Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Data Penting
            </h3>
            
            <div className="grid gap-4">
              {/* Phone Number */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Nomor Telepon
                  </label>
                  {getFieldStatus('phoneNumber') === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <Input
                  type="tel"
                  placeholder="08123456789"
                  error={errors.phoneNumber?.message}
                  {...register('phoneNumber')}
                />
              </div>

              {/* Occupation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    <User className="w-4 h-4 inline mr-1" />
                    Pekerjaan
                  </label>
                  {getFieldStatus('occupation') === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="Contoh: Karyawan Swasta, Wiraswasta, PNS"
                  error={errors.occupation?.message}
                  {...register('occupation')}
                />
              </div>
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Data Tambahan (Opsional)
            </h3>
            
            <div className="grid gap-4">
              {/* Education */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Pendidikan Terakhir
                  </label>
                  {getFieldStatus('education') === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <Select onValueChange={(value) => setValue('education', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pendidikan terakhir" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(educationLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* BPJS Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nomor BPJS
                </label>
                <Input
                  type="text"
                  placeholder="Nomor BPJS Kesehatan (opsional)"
                  {...register('bpjsNumber')}
                />
              </div>

              {/* Domicile Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status Domisili
                </label>
                <Select onValueChange={(value) => setValue('domicileStatus', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status domisili" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(domicileLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vaccination Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Status Vaksinasi COVID-19
                </label>
                <Select onValueChange={(value) => setValue('vaccinationStatus', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status vaksinasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(vaccinationLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
