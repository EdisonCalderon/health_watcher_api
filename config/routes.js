import { Router } from 'express';

import indexRoutes from '../components/index/index.api';
import authRoutes from '../components/auth/auth.api';
import measurementRoutes from '../components/measurement/measurement.api';

import AuthController from '../components/auth/auth.controller';

const router = Router();

router.use('/', indexRoutes);
router.use('/auth', authRoutes);
router.use('/measurement', measurementRoutes);

export default router;