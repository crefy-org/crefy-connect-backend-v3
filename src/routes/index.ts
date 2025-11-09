// src/routes/routes.ts
import { Router } from 'express';
import authRoutes from './auth-routes';
import emailAuthRoutes from './email-auth-routes';
import smsAuthRoutes from './sms-auth-routes';
import ensSubnameRoutes from './ens-subname-routes';
import signingRoutes from './signing-routes';
import balanceRoutes from './balance-routes';

const router: Router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/auth/email', emailAuthRoutes);
router.use('/auth/sms', smsAuthRoutes);
router.use('/auth/ens', ensSubnameRoutes);
router.use('/signing', signingRoutes);
router.use('/balance', balanceRoutes);

export default router;
