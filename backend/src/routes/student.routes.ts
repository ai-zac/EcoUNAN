import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.post('/login', studentController.login);
router.post('/register', studentController.registerDocente);

router.post('/upload', upload.single('foto'), studentController.uploadPhoto);

router.post('/seed', studentController.seedEstudiantes);
router.get('/stats', studentController.getStats);

router.route('/')
  .get(studentController.getEstudiantes)
  .post(studentController.createEstudiante);

router.route('/:id')
  .get(studentController.getEstudianteById)
  .put(studentController.updateEstudiante)
  .delete(studentController.deleteEstudiante);

export default router;
