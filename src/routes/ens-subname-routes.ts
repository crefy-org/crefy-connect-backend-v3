// src/routes/ens-subname-routes.ts
import { Router } from 'express';
import ENSSubnameController from '../controllers/ens-subname-controller';
import { authenticateToken, validateApp } from '../middleware/auth-middleware';

// Add explicit type annotation to fix the TypeScript error
const router: Router = Router();

/**
 * @route   POST /api/ens/subnames/check
 * @desc    Check if a subname is available on Sepolia testnet
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    { label: string }
 * @returns {Object} Subname availability information
 */
router.post('/check', authenticateToken, ENSSubnameController.checkSubname);

/**
 * @route   POST /api/ens/subnames/claim
 * @desc    Claim a subname on Sepolia testnet
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    { label: string }
 * @returns {Object} Claim transaction result
 */
router.post('/claim', authenticateToken, ENSSubnameController.claimSubname);

/**
 * @route   GET /api/ens/subnames/user
 * @desc    Get all subnames claimed by a user on Sepolia
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @query   { userAddress: string }
 * @returns {Object} User's subnames list
 */
router.get(
    '/user',
    authenticateToken,
    validateApp,
    ENSSubnameController.getUserSubnames,
);

/**
 * @route   GET /api/ens/subnames/all
 * @desc    Get all registered subnames on Sepolia
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @returns {Object} All registered subnames
 */
router.get('/all', authenticateToken, ENSSubnameController.getAllSubnames);

/**
 * @route   GET /api/ens/subnames/status
 * @desc    Get Sepolia service status and contract information
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @returns {Object} Service status information
 */
router.get('/status', authenticateToken, ENSSubnameController.getServiceStatus);

/**
 * @route   GET /api/ens/subnames/has-claimed
 * @desc    Check if user has claimed any subnames on Sepolia
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @query   { userAddress: string }
 * @returns {Object} Claim status
 */
router.get(
    '/has-claimed',
    authenticateToken,
    ENSSubnameController.hasUserClaimedSubname,
);

/**
 * @route   GET /api/ens/subnames/network-info
 * @desc    Get Sepolia network information
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @returns {Object} Network information
 */
router.get(
    '/network-info',
    authenticateToken,
    ENSSubnameController.getNetworkInfo,
);

export default router;
