import { Router } from 'express';
import { DaerahController } from '../controllers/daerah.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Kecamatan routes
router.get('/kecamatan', authorize(['ADMIN']), DaerahController.getAllKecamatan);
router.post('/kecamatan', authorize(['ADMIN']), DaerahController.createKecamatan);
router.put('/kecamatan/:id', authorize(['ADMIN']), DaerahController.updateKecamatan);
router.delete('/kecamatan/:id', authorize(['ADMIN']), DaerahController.deleteKecamatan);

// Kelurahan routes
router.get('/kelurahan', authorize(['ADMIN']), DaerahController.getAllKelurahan);
router.get('/kelurahan/kecamatan/:kecamatanId', authorize(['ADMIN']), DaerahController.getKelurahanByKecamatan);
router.post('/kelurahan', authorize(['ADMIN']), DaerahController.createKelurahan);
router.put('/kelurahan/:id', authorize(['ADMIN']), DaerahController.updateKelurahan);
router.delete('/kelurahan/:id', authorize(['ADMIN']), DaerahController.deleteKelurahan);

export default router;
