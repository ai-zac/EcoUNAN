import { Router } from 'express';
import { materialController } from '../controllers/material.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', materialController.getMaterials);
router.get('/admin/all', protect, admin, materialController.getAllMaterialsAdmin);
router.post('/', protect, admin, materialController.createMaterial);
router.put('/:id', protect, admin, materialController.updateMaterial);
router.patch('/:id/toggle', protect, admin, materialController.toggleMaterialStatus);
router.delete('/:id', protect, admin, materialController.deleteMaterial);

export default router;
