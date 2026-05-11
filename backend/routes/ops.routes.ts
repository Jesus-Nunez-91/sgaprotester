import { Router } from 'express';
import { getMaintenanceTasks, saveMaintenanceTask, deleteMaintenanceTask, getAdminTasks, saveAdminTask, deleteAdminTask, getProjects, saveProject, deleteProject } from '../controllers/ops.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/maintenance', authMiddleware, getMaintenanceTasks);
router.post('/maintenance', authMiddleware, saveMaintenanceTask);
router.put('/maintenance/:id', authMiddleware, saveMaintenanceTask);
router.delete('/maintenance/:id', authMiddleware, deleteMaintenanceTask);

router.get('/admin-tasks', authMiddleware, getAdminTasks);
router.post('/admin-tasks', authMiddleware, saveAdminTask);
router.put('/admin-tasks/:id', authMiddleware, saveAdminTask);
router.delete('/admin-tasks/:id', authMiddleware, deleteAdminTask);

router.get('/projects', authMiddleware, getProjects);
router.post('/projects', authMiddleware, saveProject);
router.put('/projects/:id', authMiddleware, saveProject);
router.delete('/projects/:id', authMiddleware, deleteProject);

export default router;
