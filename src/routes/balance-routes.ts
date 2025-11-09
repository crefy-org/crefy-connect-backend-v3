import { Router } from 'express';
import balanceController from '../controllers/balance-controller';
import { authenticateToken } from '../middleware/auth-middleware';

const router: Router = Router();

/**
 * @route   GET /api/balance/chains
 * @desc    Get all supported chains for balance checking
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @returns {Object} List of supported chains
 */
router.get('/chains', authenticateToken, (req, res, next) => {
    balanceController
        .getSupportedChains()
        .then((result) => res.json(result))
        .catch(next);
});

/**
 * @route   POST /api/balance/native
 * @desc    Get native balance only
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} NativeBalanceRequest
 * @returns {Object} Native balance
 */
router.post('/native', authenticateToken, (req, res, next) => {
    balanceController
        .getNativeBalance(req.body)
        .then((result) => res.json(result))
        .catch(next);
});

/**
 * @route   POST /api/balance/token
 * @desc    Get token balance for a specific ERC20 token
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @query   {string} walletAddress - Wallet address
 * @query   {string} tokenAddress - Token contract address
 * @query   {number} [chainId] - Chain ID (default: 8453 for Base)
 * @returns {Object} Token balance
 */
router.post('/token', authenticateToken, (req, res, next) => {
    const { walletAddress, tokenAddress, chainId } = req.query;
    balanceController
        .getTokenBalance(
            walletAddress as string,
            tokenAddress as string,
            chainId as string,
        )
        .then((result) => res.json(result))
        .catch(next);
});

/**
 * @route   POST /api/balance/all
 * @desc    Get all balances (native + specified token)
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} BalanceRequest
 * @returns {Object} All balances
 */
router.post('/all', authenticateToken, (req, res, next) => {
    balanceController
        .getBalances(req.body)
        .then((result) => res.json(result))
        .catch(next);
});

/**
 * @route   POST /api/balance/multiple-tokens
 * @desc    Get multiple token balances at once
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} MultipleTokensRequest
 * @returns {Object} Multiple token balances
 */
router.post('/multiple-tokens', authenticateToken, (req, res, next) => {
    balanceController
        .getMultipleTokenBalances(req.body)
        .then((result) => res.json(result))
        .catch(next);
});

export default router;
