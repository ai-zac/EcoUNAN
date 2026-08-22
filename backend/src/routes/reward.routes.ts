import { Router } from 'express';
import { rewardController } from '../controllers/reward.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', rewardController.getRewards);
router.get('/my-rewards', protect, rewardController.getMyRewards);
router.post('/redeem/:id', protect, rewardController.redeemReward);

// Admin routes
router.post('/', protect, admin, rewardController.createReward);
router.put('/:id', protect, admin, rewardController.updateReward);
router.delete('/:id', protect, admin, rewardController.deleteReward);

export default router;
