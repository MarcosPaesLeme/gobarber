import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProvidersController';
import AppoimentmentController from './app/controllers/AppoimentmentController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvailableController from './app/controllers/AvailableController';

import authMiddleware from './app/middleware/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// routes.use(authMiddleware);

routes.put('/users', authMiddleware, UserController.update);
routes.post(
  '/files',
  authMiddleware,
  upload.single('file'),
  FileController.store
);
routes.get('/providers', authMiddleware, ProviderController.index);
routes.get(
  '/providers/:providerId/available',
  authMiddleware,
  AvailableController.index
);

routes.get('/appoitments', authMiddleware, AppoimentmentController.index);
routes.post('/appoitments', authMiddleware, AppoimentmentController.store);
routes.delete(
  '/appoitments/:id',
  authMiddleware,
  AppoimentmentController.delete
);

routes.get('/schedule', authMiddleware, ScheduleController.index);

routes.get('/notifications', authMiddleware, NotificationController.index);
routes.put('/notifications/:id', authMiddleware, NotificationController.update);

export default routes;
