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
import { exportLimiter } from '../middlewares/exportLimiter';

const router = Router();

// Reporte 1: Cantidad de Reciclajes Registrados
router.get('/recycles/summary', protect, admin, getSummary);
router.get('/recycles/export/excel', protect, admin, exportLimiter, exportExcel);
router.get('/recycles/export/pdf', protect, admin, exportLimiter, exportPdf);

// Reporte 2: Resumen de Usuarios
router.get('/users/summary', protect, admin, getUserSummary);
router.get('/users/export/excel', protect, admin, exportLimiter, exportUserExcel);
router.get('/users/export/pdf', protect, admin, exportLimiter, exportUserPdf);

// Reporte 3: Sistema de Recompensas
router.get('/rewards/summary', protect, admin, getRewardSummary);
router.get('/rewards/export/excel', protect, admin, exportLimiter, exportRewardExcel);
router.get('/rewards/export/pdf', protect, admin, exportLimiter, exportRewardPdf);

export default router;

