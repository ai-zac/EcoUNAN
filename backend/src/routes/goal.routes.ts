import { Router } from 'express';
import { goalController } from '../controllers/goal.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();


router.get('/', protect, goalController.getGoals);


router.get('/progress', protect, goalController.getMyProgress);
router.post('/:id/claim', protect, goalController.claimGoal);


router.post('/', protect, admin, goalController.createGoal);
router.put('/:id', protect, admin, goalController.updateGoal);
router.delete('/:id', protect, admin, goalController.deleteGoal);

export default router;
