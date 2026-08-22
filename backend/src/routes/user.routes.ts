import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

router.get('/ranking', userController.getRanking);

// Protected routes for current user
router.get('/me', protect, userController.getMe);
router.put('/profile', protect, userController.updateProfile);
router.put('/push-token', protect, userController.savePushToken);
router.post('/profile/picture', protect, upload.single('profilePicture'), userController.uploadProfilePicture);

router.route('/:id')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
