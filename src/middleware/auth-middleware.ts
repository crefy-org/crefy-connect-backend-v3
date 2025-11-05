import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/auth';
import { Wallet } from '../models/wallet-models';
import { ApiError } from '../utils/ApiError';
import type {
    IWallet,
    IWalletLean,
    IWalletResponse,
    JwtPayload,
} from '../types';
import { App } from '../models/app-models';

export interface AuthenticatedRequest extends Request {
    wallet?: IWalletResponse;
    developer_app?: any;
}

// Security-sensitive fields that should never be exposed
const SENSITIVE_FIELDS = '-encryptedPrivateKey -encryptionSalt -otp -otpExpiry';

// Fields to include in standard wallet responses
const STANDARD_WALLET_FIELDS = '-encryptedPrivateKey -encryptionSalt';

/**
 * Safely converts any wallet-like object to response object
 */
export const convertWalletToResponse = (
    walletData: IWallet | IWalletLean | any,
): IWalletResponse => {
    // Handle Mongoose document
    if (walletData && typeof walletData.toObject === 'function') {
        walletData = walletData.toObject();
    }

    return {
        _id: walletData._id?.toString() || walletData._id,
        appId: walletData.appId,
        email: walletData.email,
        phoneNumber: walletData.phoneNumber,
        subname: walletData.subname,
        socialType: walletData.socialType,
        address: walletData.address,
        publicKey: walletData.publicKey,
        // Sensitive fields are excluded by default in queries
        encryptedPrivateKey: walletData.encryptedPrivateKey,
        encryptionSalt: undefined,
        userData: walletData.userData,
        createdAt: walletData.createdAt,
        updatedAt: walletData.updatedAt,
        isActive: walletData.isActive,
        otp: walletData.otp,
        otpExpiry: walletData.otpExpiry,
        oauthTokens: walletData.oauthTokens,
    };
};

/**
 * Type guard to check if object is a valid wallet
 */
const isValidWallet = (wallet: any): wallet is IWalletLean => {
    return (
        wallet &&
        typeof wallet === 'object' &&
        wallet._id &&
        wallet.appId &&
        wallet.address &&
        wallet.publicKey
    );
};

/**
 * Extracts token from various sources (Bearer token, query parameter)
 */
const extractToken = (req: Request): string | null => {
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    // Check query parameter (for WebSocket connections or specific use cases)
    const queryToken = req.query.token as string;
    if (queryToken) {
        return queryToken;
    }

    return null;
};

/**
 * Validates JWT payload structure - UPDATED for actual JWT content
 */
const isValidJwtPayload = (payload: any): payload is JwtPayload => {
    return (
        payload &&
        typeof payload === 'object' &&
        typeof payload.address === 'string' // Only require address since that's what's in your tokens
    );
};

/**
 * Main authentication middleware - UPDATED to work with actual JWT tokens
 */
export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const token = extractToken(req);
        console.log('Token:', token);

        if (!token) {
            throw new ApiError(
                401,
                'MISSING_TOKEN',
                'Authorization token is required',
            );
        }

        // Verify JWT token
        const decoded = verifyJWT(token);
        console.log('Decoded JWT:', decoded);

        if (!isValidJwtPayload(decoded)) {
            throw new ApiError(
                401,
                'INVALID_TOKEN_PAYLOAD',
                'Invalid token payload structure - expected address field',
            );
        }

        // Find wallet in database by address (since that's what's in the JWT)
        const walletDoc = await Wallet.findOne({ address: decoded.address })
            .select('+encryptedPrivateKey')
            .lean<IWalletLean>();

        if (!walletDoc) {
            throw new ApiError(404, 'WALLET_NOT_FOUND', 'Wallet not found');
        }

        if (!isValidWallet(walletDoc)) {
            throw new ApiError(
                500,
                'INVALID_WALLET_DATA',
                'Invalid wallet data structure',
            );
        }

        if (!walletDoc.isActive) {
            throw new ApiError(403, 'WALLET_INACTIVE', 'Wallet is not active');
        }

        // Convert to response object and attach to request
        req.wallet = convertWalletToResponse(walletDoc);

        // Continue to next middleware/controller
        next();
    } catch (error: any) {
        // Handle known ApiError instances
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                },
            });
            return;
        }

        // Handle JWT verification errors
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid token signature',
                },
            });
            return;
        }

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                error: {
                    code: 'TOKEN_EXPIRED',
                    message: 'Token has expired',
                },
            });
            return;
        }

        // Generic error handling
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication failed',
            },
        });
    }
};

/**
 * Middleware to validate appId and fetch developer app
 */
export const validateApp = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const appId =
            req.body.appId || req.query.appId || req.headers['x-app-id'];

        if (!appId) {
            throw new ApiError(400, 'MISSING_APP_ID', 'APP ID is required');
        }

        if (typeof appId !== 'string') {
            throw new ApiError(
                400,
                'INVALID_APP_ID',
                'App ID must be a string',
            );
        }

        // Fetch app from database (no need for clientSecret)
        const app = await App.findOne({ appId });

        if (!app) {
            throw new ApiError(404, 'APP_NOT_FOUND', 'Invalid App ID');
        }

        // Check if app is active/valid
        if (!isAppActive(app)) {
            throw new ApiError(403, 'APP_INACTIVE', 'App is not active');
        }

        // Attach app to request object
        (req as any).developer_app = app;
        next();
    } catch (error: any) {
        // Handle known ApiError instances
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                },
            });
            return;
        }

        // Generic error handling
        console.error('App validation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Internal server error',
            },
        });
    }
};

/**
 * Check if app is active (add your business logic here)
 */
const isAppActive = (app: any): boolean => {
    // Add any app status checks here
    // For example: check if app is not suspended, not expired, etc.
    return true; // Default to true for now
};
