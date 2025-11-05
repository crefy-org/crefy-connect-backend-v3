// src/authentication.ts
import * as express from 'express';
import { verifyJWT } from './utils/auth';
import { JwtPayload } from './types';
import { App } from './models/app-models';
import { Wallet } from './models/wallet-models';
import { ApiError } from './utils/ApiError';

export async function expressAuthentication(
    request: express.Request,
    securityName: string,
    scopes?: string[],
): Promise<any> {
    if (securityName === 'bearer') {
        const token = request.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            throw new ApiError(401, 'MISSING_TOKEN', 'No token provided');
        }

        let decoded: JwtPayload;
        try {
            decoded = verifyJWT(token);
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                throw new ApiError(401, 'TOKEN_EXPIRED', 'Token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new ApiError(401, 'INVALID_TOKEN', 'Invalid token');
            }
            throw new ApiError(401, 'AUTH_ERROR', 'Authentication failed');
        }

        // Find the wallet in database
        const wallet = await Wallet.findOne({ address: decoded.address })
            .select('-encryptedPrivateKey -encryptionSalt -otp -otpExpiry')
            .lean();

        if (!wallet) {
            throw new ApiError(404, 'WALLET_NOT_FOUND', 'Wallet not found');
        }

        if (!wallet.isActive) {
            throw new ApiError(403, 'WALLET_INACTIVE', 'Wallet is not active');
        }

        // Return the wallet data - this will be available in the controller
        return {
            wallet: {
                _id: wallet._id.toString(),
                appId: wallet.appId,
                email: wallet.email,
                phoneNumber: wallet.phoneNumber,
                subname: wallet.subname,
                socialType: wallet.socialType,
                address: wallet.address,
                publicKey: wallet.publicKey,
                userData: wallet.userData,
                isActive: wallet.isActive,
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt,
            },
        };
    }

    if (securityName === 'app') {
        const appId =
            request.body.appId ||
            request.query.appId ||
            request.headers['x-app-id'];

        if (!appId) {
            throw new ApiError(400, 'MISSING_APP_ID', 'App ID is required');
        }

        const app = await App.findOne({ appId });

        if (!app) {
            throw new ApiError(404, 'INVALID_APP_ID', 'Invalid App ID');
        }

        // Return app data
        return {
            app: {
                appId: app.appId,
                developerId: app.developerId,
                name: app.name,
            },
        };
    }

    throw new ApiError(
        400,
        'UNSUPPORTED_SECURITY',
        `Unsupported security type: ${securityName}`,
    );
}
