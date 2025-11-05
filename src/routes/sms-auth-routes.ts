// src/routes/sms-auth-routes.ts
import { Router } from 'express';
import SmsAuthController from '../controllers/sms-auth-controller';
import { validateApp } from '../middleware/auth-middleware';

const router: Router = Router();

/**
 * @route   POST /api/auth/sms/login
 * @desc    Login or register with phone number, sends OTP via SMS
 * @access  Public (with app validation)
 * @header  X-App-ID: your-app-id
 * @body    { phoneNumber: string }
 * @returns { success: boolean, message: string, isActive?: boolean, walletExists?: boolean }
 */
router.post('/login', validateApp, async (req, res, next) => {
    try {
        // Type assertion to ensure body structure
        const body = req.body as { phoneNumber: string };
        await SmsAuthController.smsLogin(body, req);

        // Since tsoa handles the response, we don't need to send it manually
        // The response will be sent by the tsoa controller
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/auth/sms/verify
 * @desc    Verify SMS OTP and activate wallet
 * @access  Public (with app validation)
 * @header  X-App-ID: your-app-id
 * @body    { phoneNumber: string, otp: string }
 * @returns { success: boolean, message: string, data?: object, isActive?: boolean, token?: string }
 */
router.post('/verify', validateApp, async (req, res, next) => {
    try {
        const body = req.body as { phoneNumber: string; otp: string };
        await SmsAuthController.verifySmsOTP(body, req);
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/auth/sms/resend-otp
 * @desc    Resend OTP via SMS
 * @access  Public (with app validation)
 * @header  X-App-ID: your-app-id
 * @body    { phoneNumber: string }
 * @returns { success: boolean, message: string }
 */
router.post('/resend-otp', validateApp, async (req, res, next) => {
    try {
        const body = req.body as { phoneNumber: string };
        await SmsAuthController.resendSmsOTP(body, req);
    } catch (error) {
        next(error);
    }
});

export default router;
