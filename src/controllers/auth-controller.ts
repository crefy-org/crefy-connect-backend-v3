import {
    Get,
    Route,
    Controller,
    Tags,
    SuccessResponse,
    Request,
    Security,
} from 'tsoa';
import { ApiError } from '../utils/ApiError';

interface WalletResponse {
    success: boolean;
    data: {
        wallet: {
            email: string;
            socialType: string;
            address: string;
            userData: string;
            isActive: boolean;
        };
    };
}

@Route('auth')
@Tags('Authentication')
export class AuthController extends Controller {
    /**
     * Get wallet information for the authenticated wallet
     * @param request - The request object
     * @returns The wallet information
     */
    @Get('wallet-info')
    @SuccessResponse('200', 'Wallet information retrieved successfully')
    @Security('bearer')
    public async getWalletInfo(
        @Request() request: any,
    ): Promise<WalletResponse> {
        const { wallet } = request.user;

        if (!wallet) {
            throw new ApiError(
                401,
                'UNAUTHENTICATED',
                'Wallet not authenticated',
            );
        }

        return {
            success: true,
            data: {
                wallet: {
                    email: wallet.email,
                    socialType: wallet.socialType,
                    address: wallet.address,
                    userData: wallet.userData,
                    isActive: wallet.isActive,
                },
            },
        };
    }
}

export default new AuthController();
