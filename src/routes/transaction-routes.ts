import { Router } from 'express';
import transactionController from '../controllers/transaction-controller';
import { authenticateToken } from '../middleware/auth-middleware';

const router: Router = Router();

/**
 * @route   POST /api/transactions/send
 * @desc    Send transaction (native token or ERC20)
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} SendTransactionRequest
 * @returns {Object} Transaction result
 */
router.post('/send', authenticateToken, (req, res, next) => {
    transactionController
        .sendTransaction(req.body, req)
        .then((result) => res.json(result))
        .catch(next);
});

/**
 * @route   POST /api/transactions/history
 * @desc    Get transaction history for a wallet
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} TransactionHistoryRequest
 * @returns {Object} Transaction history
 */
router.post('/history', authenticateToken, (req, res, next) => {
    transactionController
        .getTransactionHistory(req.body)
        .then((result) => res.json(result))
        .catch(next);
});

/**
 * @route   GET /api/transactions/gas-prices
 * @desc    Get current gas prices for a chain
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @query   {number} chainId - Chain ID
 * @returns {Object} Gas prices
 */
router.get('/gas-prices', authenticateToken, (req, res, next) => {
    transactionController
        .getGasPrices(req.query.chainId as string)
        .then((result) => res.json(result))
        .catch(next);
});

/**
 * @route   GET /api/transactions/status
 * @desc    Get transaction status
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @query   {number} chainId - Chain ID
 * @query   {string} transactionHash - Transaction hash
 * @returns {Object} Transaction status
 */
router.get('/status', authenticateToken, (req, res, next) => {
    transactionController
        .getTransactionStatus(
            req.query.chainId as string,
            req.query.transactionHash as string,
        )
        .then((result) => res.json(result))
        .catch(next);
});

/**
 * @route   POST /api/transactions/estimate-gas
 * @desc    Estimate transaction gas
 * @access  Private
 * @header  Authorization: Bearer <token>
 * @body    {Object} SendTransactionRequest
 * @returns {Object} Gas estimate
 */
router.post('/estimate-gas', authenticateToken, (req, res, next) => {
    transactionController
        .estimateGas(req.body, req)
        .then((result) => res.json(result))
        .catch(next);
});

export default router;
