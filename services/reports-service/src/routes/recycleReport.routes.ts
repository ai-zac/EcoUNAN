import { Router } from 'express';
import {
  getSummary,
  exportExcel,
  exportPdf,
} from '../controllers/recycleReport.controller';
import {
  getUserSummary,
  exportUserExcel,
  exportUserPdf,
} from '../controllers/userReport.controller';
import {
  getRewardSummary,
  exportRewardExcel,
  exportRewardPdf,
} from '../controllers/rewardReport.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

// Reporte 1: Cantidad de Reciclajes Registrados
router.get('/recycles/summary', protect, admin, getSummary);
router.get('/recycles/export/excel', protect, admin, exportExcel);
router.get('/recycles/export/pdf', protect, admin, exportPdf);

// Reporte 2: Resumen de Usuarios
router.get('/users/summary', protect, admin, getUserSummary);
router.get('/users/export/excel', protect, admin, exportUserExcel);
router.get('/users/export/pdf', protect, admin, exportUserPdf);

// Reporte 3: Sistema de Recompensas
router.get('/rewards/summary', protect, admin, getRewardSummary);
router.get('/rewards/export/excel', protect, admin, exportRewardExcel);
router.get('/rewards/export/pdf', protect, admin, exportRewardPdf);

export default router;

