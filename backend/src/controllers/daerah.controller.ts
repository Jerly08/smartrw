import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DaerahController {
  // Get all Kecamatan
  static async getAllKecamatan(req: Request, res: Response) {
    try {
      const kecamatans = await prisma.kecamatan.findMany({
        where: { isActive: true },
        include: {
          kelurahans: {
            where: { isActive: true },
            select: {
              id: true,
              kode: true,
              nama: true,
            }
          }
        },
        orderBy: { nama: 'asc' }
      });

      res.json({
        status: 'success',
        data: { kecamatans }
      });
    } catch (error) {
      console.error('Error fetching kecamatan:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data kecamatan'
      });
    }
  }

  // Create new Kecamatan
  static async createKecamatan(req: Request, res: Response) {
    try {
      const { kode, nama } = req.body;

      // Check if kode already exists
      const existingKecamatan = await prisma.kecamatan.findUnique({
        where: { kode }
      });

      if (existingKecamatan) {
        return res.status(400).json({
          status: 'error',
          message: 'Kode kecamatan sudah ada'
        });
      }

      const kecamatan = await prisma.kecamatan.create({
        data: {
          kode,
          nama
        }
      });

      res.status(201).json({
        status: 'success',
        message: 'Kecamatan berhasil dibuat',
        data: { kecamatan }
      });
    } catch (error) {
      console.error('Error creating kecamatan:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal membuat kecamatan'
      });
    }
  }

  // Update Kecamatan
  static async updateKecamatan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { kode, nama, isActive } = req.body;

      // Check if kode already exists (except current record)
      if (kode) {
        const existingKecamatan = await prisma.kecamatan.findFirst({
          where: {
            kode,
            NOT: { id: parseInt(id) }
          }
        });

        if (existingKecamatan) {
          return res.status(400).json({
            status: 'error',
            message: 'Kode kecamatan sudah ada'
          });
        }
      }

      const kecamatan = await prisma.kecamatan.update({
        where: { id: parseInt(id) },
        data: {
          ...(kode && { kode }),
          ...(nama && { nama }),
          ...(typeof isActive === 'boolean' && { isActive })
        }
      });

      res.json({
        status: 'success',
        message: 'Kecamatan berhasil diperbarui',
        data: { kecamatan }
      });
    } catch (error) {
      console.error('Error updating kecamatan:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal memperbarui kecamatan'
      });
    }
  }

  // Delete Kecamatan (soft delete)
  static async deleteKecamatan(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if kecamatan has active kelurahans
      const kelurahansCount = await prisma.kelurahan.count({
        where: {
          kecamatanId: parseInt(id),
          isActive: true
        }
      });

      if (kelurahansCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Tidak dapat menghapus kecamatan yang memiliki kelurahan aktif'
        });
      }

      await prisma.kecamatan.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      res.json({
        status: 'success',
        message: 'Kecamatan berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting kecamatan:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal menghapus kecamatan'
      });
    }
  }

  // Get all Kelurahan by Kecamatan
  static async getKelurahanByKecamatan(req: Request, res: Response) {
    try {
      const { kecamatanId } = req.params;

      const kelurahans = await prisma.kelurahan.findMany({
        where: {
          kecamatanId: parseInt(kecamatanId),
          isActive: true
        },
        include: {
          kecamatan: {
            select: {
              id: true,
              nama: true,
              kode: true
            }
          }
        },
        orderBy: { nama: 'asc' }
      });

      res.json({
        status: 'success',
        data: { kelurahans }
      });
    } catch (error) {
      console.error('Error fetching kelurahan:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data kelurahan'
      });
    }
  }

  // Create new Kelurahan
  static async createKelurahan(req: Request, res: Response) {
    try {
      const { kode, nama, kecamatanId } = req.body;

      // Check if kode already exists
      const existingKelurahan = await prisma.kelurahan.findUnique({
        where: { kode }
      });

      if (existingKelurahan) {
        return res.status(400).json({
          status: 'error',
          message: 'Kode kelurahan sudah ada'
        });
      }

      // Check if kecamatan exists
      const kecamatan = await prisma.kecamatan.findUnique({
        where: { id: kecamatanId }
      });

      if (!kecamatan) {
        return res.status(400).json({
          status: 'error',
          message: 'Kecamatan tidak ditemukan'
        });
      }

      const kelurahan = await prisma.kelurahan.create({
        data: {
          kode,
          nama,
          kecamatanId
        },
        include: {
          kecamatan: {
            select: {
              id: true,
              nama: true,
              kode: true
            }
          }
        }
      });

      res.status(201).json({
        status: 'success',
        message: 'Kelurahan berhasil dibuat',
        data: { kelurahan }
      });
    } catch (error) {
      console.error('Error creating kelurahan:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal membuat kelurahan'
      });
    }
  }

  // Update Kelurahan
  static async updateKelurahan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { kode, nama, kecamatanId, isActive } = req.body;

      // Check if kode already exists (except current record)
      if (kode) {
        const existingKelurahan = await prisma.kelurahan.findFirst({
          where: {
            kode,
            NOT: { id: parseInt(id) }
          }
        });

        if (existingKelurahan) {
          return res.status(400).json({
            status: 'error',
            message: 'Kode kelurahan sudah ada'
          });
        }
      }

      // Check if kecamatan exists (if changing kecamatan)
      if (kecamatanId) {
        const kecamatan = await prisma.kecamatan.findUnique({
          where: { id: kecamatanId }
        });

        if (!kecamatan) {
          return res.status(400).json({
            status: 'error',
            message: 'Kecamatan tidak ditemukan'
          });
        }
      }

      const kelurahan = await prisma.kelurahan.update({
        where: { id: parseInt(id) },
        data: {
          ...(kode && { kode }),
          ...(nama && { nama }),
          ...(kecamatanId && { kecamatanId }),
          ...(typeof isActive === 'boolean' && { isActive })
        },
        include: {
          kecamatan: {
            select: {
              id: true,
              nama: true,
              kode: true
            }
          }
        }
      });

      res.json({
        status: 'success',
        message: 'Kelurahan berhasil diperbarui',
        data: { kelurahan }
      });
    } catch (error) {
      console.error('Error updating kelurahan:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal memperbarui kelurahan'
      });
    }
  }

  // Delete Kelurahan (soft delete)
  static async deleteKelurahan(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if kelurahan has active RTs
      const rtsCount = await prisma.rT.count({
        where: {
          kelurahanId: parseInt(id),
          isActive: true
        }
      });

      if (rtsCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Tidak dapat menghapus kelurahan yang memiliki RT aktif'
        });
      }

      await prisma.kelurahan.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      res.json({
        status: 'success',
        message: 'Kelurahan berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting kelurahan:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal menghapus kelurahan'
      });
    }
  }

  // Get all Kelurahan (for dropdown selection)
  static async getAllKelurahan(req: Request, res: Response) {
    try {
      const kelurahans = await prisma.kelurahan.findMany({
        where: { isActive: true },
        include: {
          kecamatan: {
            select: {
              id: true,
              nama: true,
              kode: true
            }
          }
        },
        orderBy: [
          { kecamatan: { nama: 'asc' } },
          { nama: 'asc' }
        ]
      });

      res.json({
        status: 'success',
        data: { kelurahans }
      });
    } catch (error) {
      console.error('Error fetching all kelurahan:', error);
      res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data kelurahan'
      });
    }
  }
}
