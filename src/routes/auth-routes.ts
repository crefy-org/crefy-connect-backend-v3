import { Router } from 'express';
import AuthController from '../controllers/auth-controller';
import { authenticateToken } from '../middleware/auth-middleware';

// Add explicit type annotation to fix the TypeScript error
const router: Router = Router();

/**
 * @route   GET /api/auth/wallet
 * @desc    Get current authenticated wallet information
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @returns {Object} Wallet information
 */
router.get('/wallet', authenticateToken, AuthController.getWalletInfo);

export default router;
