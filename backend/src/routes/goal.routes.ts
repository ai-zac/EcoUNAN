import { Router } from 'express';
import { goalController } from '../controllers/goal.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

// Lectura: cualquier usuario autenticado (staff puede pedir inactivas con ?includeInactive=true)
router.get('/', protect, goalController.getGoals);

// Progreso y reclamo: self-service para cualquier usuario autenticado
router.get('/progress', protect, goalController.getMyProgress);
router.post('/:id/claim', protect, goalController.claimGoal);

// Gestion: solo admin y superadmin
router.post('/', protect, admin, goalController.createGoal);
router.put('/:id', protect, admin, goalController.updateGoal);
router.delete('/:id', protect, admin, goalController.deleteGoal);

export default router;
