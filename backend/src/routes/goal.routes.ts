import { Router } from 'express';
import { goalController } from '../controllers/goal.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', protect, goalController.getGoals);

export default router;
