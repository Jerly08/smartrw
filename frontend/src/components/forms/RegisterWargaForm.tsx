'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

// Validation schema untuk register warga
const registerWargaSchema = z.object({
  // User fields
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
  
  // Resident fields
  nik: z.string().length(16, 'NIK harus 16 digit'),
  noKK: z.string().length(16, 'No. KK harus 16 digit'),
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN'], { required_error: 'Pilih jenis kelamin' }),
  birthPlace: z.string().min(2, 'Tempat lahir minimal 2 karakter'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  address: z.string().min(5, 'Alamat minimal 5 karakter'),
  rtNumber: z.string().min(1, 'RT wajib diisi'),
  rwNumber: z.string().min(1, 'RW wajib diisi'),
  religion: z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA'], {
    required_error: 'Pilih agama'
  }),
  maritalStatus: z.enum(['BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI'], {
    required_error: 'Pilih status perkawinan'
  }),
  occupation: z.string().optional(),
  education: z.enum(['TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3']).optional(),
  phoneNumber: z.string().optional(),
  domicileStatus: z.enum(['TETAP', 'KONTRAK', 'KOST', 'LAINNYA']).optional(),
  vaccinationStatus: z.enum(['BELUM', 'DOSIS_1', 'DOSIS_2', 'BOOSTER_1', 'BOOSTER_2']).optional(),
  familyRole: z.enum(['KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'LAINNYA']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak sama",
  path: ["confirmPassword"],
});

type RegisterWargaFormData = z.infer<typeof registerWargaSchema>;

export default function RegisterWargaForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<RegisterWargaFormData>({
    resolver: zodResolver(registerWargaSchema),
    mode: 'onChange',
  });

  // Watch untuk validasi step
  const watchedFields = watch();

  const onSubmit = async (data: RegisterWargaFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...submitData } = data;
      
      const response = await fetch('/api/auth/register/warga', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success(result.message || 'Pendaftaran berhasil!');
        
        // Store token dan user data
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        // Redirect ke dashboard atau halaman konfirmasi
        router.push('/dashboard?registered=true');
      } else {
        throw new Error(result.message || 'Gagal mendaftar');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof RegisterWargaFormData)[] => {
    switch (step) {
      case 1:
        return ['email', 'password', 'confirmPassword', 'fullName'];
      case 2:
        return ['nik', 'noKK', 'gender', 'birthPlace', 'birthDate'];
      case 3:
        return ['address', 'rtNumber', 'rwNumber', 'religion', 'maritalStatus'];
      default:
        return [];
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Informasi Akun</h3>
      
      <Input
        label="Email *"
        type="email"
        placeholder="nama@email.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password *"
        type="password"
        placeholder="Minimal 6 karakter"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Konfirmasi Password *"
        type="password"
        placeholder="Masukkan ulang password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Input
        label="Nama Lengkap *"
        type="text"
        placeholder="Masukkan nama lengkap sesuai KTP"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Data Pribadi</h3>
      
      <Input
        label="NIK *"
        type="text"
        placeholder="16 digit NIK"
        maxLength={16}
        error={errors.nik?.message}
        {...register('nik')}
      />

      <Input
        label="Nomor KK *"
        type="text"
        placeholder="16 digit Nomor Kartu Keluarga"
        maxLength={16}
        error={errors.noKK?.message}
        {...register('noKK')}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jenis Kelamin *
        </label>
        <Select onValueChange={(value) => setValue('gender', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis kelamin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
            <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
          </SelectContent>
        </Select>
        {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
      </div>

      <Input
        label="Tempat Lahir *"
        type="text"
        placeholder="Kota/Kabupaten tempat lahir"
        error={errors.birthPlace?.message}
        {...register('birthPlace')}
      />

      <Input
        label="Tanggal Lahir *"
        type="date"
        error={errors.birthDate?.message}
        {...register('birthDate')}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Alamat & Detail</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alamat *
        </label>
        <textarea
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Alamat lengkap tempat tinggal"
          {...register('address')}
        />
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="RT *"
          type="text"
          placeholder="001"
          maxLength={3}
          error={errors.rtNumber?.message}
          {...register('rtNumber')}
        />

        <Input
          label="RW *"
          type="text"
          placeholder="001"
          maxLength={3}
          error={errors.rwNumber?.message}
          {...register('rwNumber')}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Agama *
        </label>
        <Select onValueChange={(value) => setValue('religion', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih agama" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ISLAM">Islam</SelectItem>
            <SelectItem value="KRISTEN">Kristen</SelectItem>
            <SelectItem value="KATOLIK">Katolik</SelectItem>
            <SelectItem value="HINDU">Hindu</SelectItem>
            <SelectItem value="BUDDHA">Buddha</SelectItem>
            <SelectItem value="KONGHUCU">Konghucu</SelectItem>
            <SelectItem value="LAINNYA">Lainnya</SelectItem>
          </SelectContent>
        </Select>
        {errors.religion && <p className="mt-1 text-sm text-red-600">{errors.religion.message}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status Perkawinan *
        </label>
        <Select onValueChange={(value) => setValue('maritalStatus', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih status perkawinan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BELUM_KAWIN">Belum Kawin</SelectItem>
            <SelectItem value="KAWIN">Kawin</SelectItem>
            <SelectItem value="CERAI_HIDUP">Cerai Hidup</SelectItem>
            <SelectItem value="CERAI_MATI">Cerai Mati</SelectItem>
          </SelectContent>
        </Select>
        {errors.maritalStatus && <p className="mt-1 text-sm text-red-600">{errors.maritalStatus.message}</p>}
      </div>

      <Input
        label="Pekerjaan"
        type="text"
        placeholder="Pekerjaan (opsional)"
        error={errors.occupation?.message}
        {...register('occupation')}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pendidikan
        </label>
        <Select onValueChange={(value) => setValue('education', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih pendidikan terakhir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TIDAK_SEKOLAH">Tidak Sekolah</SelectItem>
            <SelectItem value="SD">SD</SelectItem>
            <SelectItem value="SMP">SMP</SelectItem>
            <SelectItem value="SMA">SMA</SelectItem>
            <SelectItem value="D1">D1</SelectItem>
            <SelectItem value="D2">D2</SelectItem>
            <SelectItem value="D3">D3</SelectItem>
            <SelectItem value="S1">S1</SelectItem>
            <SelectItem value="S2">S2</SelectItem>
            <SelectItem value="S3">S3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Input
        label="Nomor Telepon"
        type="tel"
        placeholder="08123456789 (opsional)"
        error={errors.phoneNumber?.message}
        {...register('phoneNumber')}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status Domisili
        </label>
        <Select onValueChange={(value) => setValue('domicileStatus', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih status domisili" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TETAP">Tetap</SelectItem>
            <SelectItem value="KONTRAK">Kontrak</SelectItem>
            <SelectItem value="KOST">Kost</SelectItem>
            <SelectItem value="LAINNYA">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status Vaksinasi
        </label>
        <Select onValueChange={(value) => setValue('vaccinationStatus', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih status vaksinasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BELUM">Belum</SelectItem>
            <SelectItem value="DOSIS_1">Dosis 1</SelectItem>
            <SelectItem value="DOSIS_2">Dosis 2</SelectItem>
            <SelectItem value="BOOSTER_1">Booster 1</SelectItem>
            <SelectItem value="BOOSTER_2">Booster 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role dalam Keluarga
        </label>
        <Select onValueChange={(value) => setValue('familyRole', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih role dalam keluarga" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="KEPALA_KELUARGA">Kepala Keluarga</SelectItem>
            <SelectItem value="ISTRI">Istri</SelectItem>
            <SelectItem value="ANAK">Anak</SelectItem>
            <SelectItem value="LAINNYA">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                RW
              </div>
              <span className="ml-2 text-2xl font-bold text-blue-600">Smart RW</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <h1 className="text-2xl font-bold">Daftar Sebagai Warga</h1>
              <p className="mt-2 text-gray-600">
                Lengkapi data diri untuk mendaftar sebagai warga
              </p>
            </CardTitle>
            
            {/* Progress indicator */}
            <div className="flex justify-center mt-4">
              <div className="flex items-center space-x-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-12 h-1 ${
                          step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              <div className="flex justify-between">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={isLoading}
                  >
                    Sebelumnya
                  </Button>
                )}
                
                <div className="ml-auto">
                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={isLoading}
                    >
                      Selanjutnya
                    </Button>
                  ) : (
                    <Button type="submit" isLoading={isLoading}>
                      Daftar
                    </Button>
                  )}
                </div>
              </div>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Sudah memiliki akun?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Masuk disini
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
