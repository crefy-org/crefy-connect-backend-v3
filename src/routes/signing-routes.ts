// src/routes/signing-routes.ts
import { Router } from 'express';
import SigningController from '../controllers/signing-controller';
import { authenticateToken } from '../middleware/auth-middleware';

const router: Router = Router();

/**
 * @route   GET /api/signing/chains
 * @desc    Get all supported chains for signing
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @returns {Object} List of supported chains
 */
router.get('/chains', authenticateToken, SigningController.getSupportedChains);

/**
 * @route   GET /api/signing/chain-info
 * @desc    Get information for a specific chain
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @param   {number} chainId - Chain ID
 * @returns {Object} Chain information
 */
router.get('/chain-info', authenticateToken, SigningController.getChainInfo);

/**
 * @route   POST /api/signing/sign-message
 * @desc    Sign a message (EIP-191)
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} SignMessageRequest
 * @returns {Object} Signature result
 */
router.post('/sign-message', authenticateToken, SigningController.signMessage);

/**
 * @route   POST /api/signing/sign-transaction
 * @desc    Sign a transaction
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} SignTransactionRequest
 * @returns {Object} Signed transaction
 */
router.post(
    '/sign-transaction',
    authenticateToken,
    SigningController.signTransaction,
);

/**
 * @route   POST /api/signing/sign-typed-data
 * @desc    Sign typed data (EIP-712)
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} SignTypedDataRequest
 * @returns {Object} Signature result
 */
router.post(
    '/sign-typed-data',
    authenticateToken,
    SigningController.signTypedData,
);

/**
 * @route   POST /api/signing/send-signed-transaction
 * @desc    Send a signed transaction
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} SendSignedTransactionRequest
 * @returns {Object} Transaction result
 */
router.post(
    '/send-signed-transaction',
    authenticateToken,
    SigningController.sendSignedTransaction,
);

/**
 * @route   POST /api/signing/verify-message
 * @desc    Verify a message signature
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} VerifyMessageRequest
 * @returns {Object} Verification result
 */
router.post(
    '/verify-message',
    authenticateToken,
    SigningController.verifyMessage,
);

export default router;
