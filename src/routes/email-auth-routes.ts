import { Router } from 'express';
import EmailAuthController from '../controllers/email-auth-controller';
import { validateApp } from '../middleware/auth-middleware';

const router: Router = Router();

/**
 * @route   POST /api/auth/email/login
 * @desc    Login or register with email, sends OTP
 * @access  Public (with app validation)
 * @header  X-App-ID: your-app-id
 * @body    { email: string }
 * @returns { success: boolean, message: string, isActive?: boolean, walletExists?: boolean }
 */
router.post('/login', validateApp, async (req, res, next) => {
    try {
        // Type assertion to ensure body structure
        const body = req.body as { email: string };
        await EmailAuthController.emailLogin(body, req);

        // Since tsoa handles the response, we don't need to send it manually
        // The response will be sent by the tsoa controller
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/auth/email/verify
 * @desc    Verify OTP and activate wallet
 * @access  Public (with app validation)
 * @header  X-App-ID: your-app-id
 * @body    { email: string, otp: string }
 * @returns { success: boolean, message: string, data?: object, isActive?: boolean, token?: string }
 */
router.post('/verify', validateApp, async (req, res, next) => {
    try {
        const body = req.body as { email: string; otp: string };
        await EmailAuthController.verifyOTP(body, req);
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /api/auth/email/resend-otp
 * @desc    Resend OTP to email
 * @access  Public (with app validation)
 * @header  X-App-ID: your-app-id
 * @body    { email: string }
 * @returns { success: boolean, message: string }
 */
router.post('/resend-otp', validateApp, async (req, res, next) => {
    try {
        const body = req.body as { email: string };
        await EmailAuthController.resendOTP(body, req);
    } catch (error) {
        next(error);
    }
});

export default router;
