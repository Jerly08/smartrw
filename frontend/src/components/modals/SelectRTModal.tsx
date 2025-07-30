'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { Search, MapPin, Users, Phone, Mail, Clock, CheckCircle } from 'lucide-react';

interface RT {
  id: number;
  number: string;
  name?: string;
  description?: string;
  address?: string;
  chairperson?: string;
  phoneNumber?: string;
  email?: string;
  isActive: boolean;
  _count: {
    residents: number;
    families: number;
  };
}

interface SelectRTModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentRTNumber?: string;
}

export default function SelectRTModal({
  isOpen,
  onClose,
  onSuccess,
  currentRTNumber
}: SelectRTModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rts, setRts] = useState<RT[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRT, setSelectedRT] = useState<RT | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRTs();
    }
  }, [isOpen]);

  const fetchRTs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rt?page=1&limit=50&includeInactive=false', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRts(data.data?.rts || []);
      } else {
        throw new Error('Gagal memuat data RT');
      }
    } catch (error: any) {
      console.error('Error fetching RTs:', error);
      toast.error(error.message || 'Gagal memuat data RT');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRT = async (rt: RT) => {
    setIsJoining(true);
    try {
      const response = await fetch('/api/residents/join-rt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rtNumber: rt.number
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Berhasil bergabung dengan RT! Menunggu verifikasi pengurus RT.');
        onSuccess?.();
        onClose();
      } else {
        throw new Error(result.message || 'Gagal bergabung dengan RT');
      }
    } catch (error: any) {
      console.error('Join RT error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat bergabung dengan RT');
    } finally {
      setIsJoining(false);
    }
  };

  const filteredRTs = rts.filter(rt => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      rt.number.toLowerCase().includes(searchLower) ||
      rt.name?.toLowerCase().includes(searchLower) ||
      rt.chairperson?.toLowerCase().includes(searchLower) ||
      rt.address?.toLowerCase().includes(searchLower)
    );
  });

  const RTCard = ({ rt }: { rt: RT }) => {
    const isCurrentRT = currentRTNumber === rt.number;
    
    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          selectedRT?.id === rt.id 
            ? 'ring-2 ring-blue-500 border-blue-200' 
            : isCurrentRT
              ? 'border-green-200 bg-green-50'
              : 'hover:border-gray-300'
        }`}
        onClick={() => !isCurrentRT && setSelectedRT(rt)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-500" />
              RT {rt.number.padStart(3, '0')}
              {rt.name && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({rt.name})
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isCurrentRT && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  RT Saat Ini
                </Badge>
              )}
              {rt.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Aktif
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Address */}
          {rt.address && (
            <div className="flex items-start">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600 ml-2">{rt.address}</span>
            </div>
          )}

          {/* Chairperson */}
          {rt.chairperson && (
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 ml-2">
                Ketua: {rt.chairperson}
              </span>
            </div>
          )}

          {/* Contact Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {rt.phoneNumber && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 ml-1">{rt.phoneNumber}</span>
                </div>
              )}
              {rt.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 ml-1">{rt.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{rt._count.residents} warga</span>
              <span>{rt._count.families} keluarga</span>
            </div>
            
            {!isCurrentRT && (
              <Button
                size="sm"
                variant={selectedRT?.id === rt.id ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinRT(rt);
                }}
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <Clock className="w-3 h-3 mr-1 animate-spin" />
                    Bergabung...
                  </>
                ) : (
                  'Pilih RT Ini'
                )}
              </Button>
            )}
          </div>

          {/* Description */}
          {rt.description && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600">{rt.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih RT yang Ingin Anda Masuki</DialogTitle>
          <DialogDescription>
            Pilih RT sesuai dengan alamat tempat tinggal Anda. Setelah memilih, data Anda akan dikirim ke pengurus RT untuk diverifikasi.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cari RT berdasarkan nomor, nama, ketua, atau alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* RT List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredRTs.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'RT Tidak Ditemukan' : 'Belum Ada RT'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Coba gunakan kata kunci pencarian yang berbeda'
                  : 'Belum ada RT yang terdaftar dalam sistem'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRTs.map((rt) => (
                <RTCard key={rt.id} rt={rt} />
              ))}
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="border-t pt-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  Informasi Penting
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Setelah memilih RT, pengurus RT akan memverifikasi data Anda dalam 1-3 hari kerja. 
                  Pastikan memilih RT yang sesuai dengan alamat tempat tinggal Anda.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isJoining}
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
