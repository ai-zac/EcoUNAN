import { Router } from 'express';
import { staffController } from '../controllers/staff.controller';
import { protect, superAdmin } from '../middlewares/auth.middleware';

const router = Router();


router.use(protect, superAdmin);

router.get('/users', staffController.getUsers);
router.post('/users', staffController.createStaff);
router.put('/users/:id/role', staffController.updateRole);
router.put('/users/:id/status', staffController.toggleStatus);

export default router;
