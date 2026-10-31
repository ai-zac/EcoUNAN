import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { protect, superAdmin } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();


router.route('/')
  .get(protect, superAdmin, userController.getUsers);

router.get('/ranking', protect, userController.getRanking);


router.get('/me', protect, userController.getMe);
router.put('/profile', protect, userController.updateProfile);
router.put('/password', protect, userController.changePassword);
router.put('/push-token', protect, userController.savePushToken);
router.post('/profile/picture', protect, upload.single('profilePicture'), userController.uploadProfilePicture);


router.route('/:id')
  .get(protect, superAdmin, userController.getUser)
  .put(protect, superAdmin, userController.updateUser)
  .delete(protect, superAdmin, userController.deleteUser);

export default router;
