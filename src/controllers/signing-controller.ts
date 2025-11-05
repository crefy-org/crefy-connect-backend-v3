// src/controllers/signing-controller.ts
import {
    Controller,
    Post,
    Get,
    Route,
    Tags,
    Body,
    Query,
    SuccessResponse,
    Request,
    Example,
    Security,
    Response,
} from 'tsoa';
import { ApiError } from '../utils/ApiError';
import { Request as ExpressRequest } from 'express';
import { Wallet } from '../models/wallet-models';
import { SigningService } from '../services/signing-service';
import {
    SignMessageRequest,
    SignTransactionRequest,
    SignTypedDataRequest,
    SigningResponse,
} from '../types/signing-types';

// Use the actual types directly instead of extending
// This helps TSOA resolve the types properly

interface SendSignedTransactionRequest {
    chainId: number;
    signedTransaction: string;
}

interface VerifyMessageRequest {
    chainId: number;
    message: string;
    signature: string;
    address?: string;
}

interface ChainInfoResponse {
    success: boolean;
    chains: Array<{
        chainId: number;
        name: string;
        testnet: boolean;
        currency: string;
        explorerUrl: string;
        rpcUrl: string;
    }>;
}

// Example data for Swagger
const exampleTypedData = {
    domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    types: {
        Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
        ],
        Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
        ],
    },
    primaryType: 'Mail',
    message: {
        from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        },
        to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        },
        contents: 'Hello, Bob!',
    },
};

@Route('signing')
@Tags('Signing Service')
@Security('app')
@Security('bearer')
export class SigningController extends Controller {
    private signingService: SigningService;

    constructor() {
        super();
        this.signingService = new SigningService();
    }

    /**
     * Get all supported chains
     */
    @Get('chains')
    @SuccessResponse('200', 'Supported chains retrieved successfully')
    @Example<ChainInfoResponse>({
        success: true,
        chains: [
            {
                chainId: 1,
                name: 'Ethereum',
                testnet: false,
                currency: 'ETH',
                explorerUrl: 'https://etherscan.io',
                rpcUrl: 'https://eth.llamarpc.com',
            },
        ],
    })
    public async getSupportedChains(): Promise<ChainInfoResponse> {
        try {
            const chains = this.signingService.getSupportedChains();
            return {
                success: true,
                chains,
            };
        } catch (error) {
            console.error('Error getting supported chains:', error);
            throw new ApiError(
                500,
                'SERVICE_ERROR',
                `Failed to get supported chains: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get chain information
     */
    @Get('chain-info')
    @SuccessResponse('200', 'Chain information retrieved successfully')
    @Response('400', 'Invalid chain ID')
    public async getChainInfo(
        @Query() chainId: string,
    ): Promise<{ success: boolean; chain: any }> {
        try {
            const chainIdNumber = parseInt(chainId, 10);
            if (isNaN(chainIdNumber)) {
                throw new ApiError(
                    400,
                    'INVALID_CHAIN_ID',
                    'Chain ID must be a valid number',
                );
            }

            const chain = this.signingService.getChainInfo(chainIdNumber);
            return {
                success: true,
                chain,
            };
        } catch (error) {
            console.error('Error getting chain info:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                400,
                'INVALID_CHAIN',
                `Failed to get chain info: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Sign a message (EIP-191)
     */
    @Post('sign-message')
    @SuccessResponse('200', 'Message signed successfully')
    @Example<SigningResponse>({
        success: true,
        signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        chainId: 1,
        chainName: 'Ethereum',
    })
    public async signMessage(
        @Body() body: SignMessageRequest,
        @Request() request: ExpressRequest,
    ): Promise<SigningResponse> {
        const { wallet: basicWallet } = (request as any).user;

        const completeWallet = await Wallet.findOne({
            address: basicWallet.address,
        }).select('+encryptedPrivateKey +encryptionSalt');

        try {
            if (completeWallet?.encryptedPrivateKey) {
                const privateKey =
                    completeWallet.encryptedPrivateKey as `0x${string}`;
                const result = await this.signingService.signMessage(
                    body,
                    privateKey,
                );

                if (result.success) {
                    return result;
                } else {
                    throw new ApiError(
                        400,
                        'SIGNING_FAILED',
                        result.error || 'Failed to sign message',
                    );
                }
            } else {
                throw new ApiError(
                    400,
                    'WALLET_ERROR',
                    'No wallet found or private key not available',
                );
            }
        } catch (error) {
            console.error('Error signing message:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                500,
                'SIGNING_ERROR',
                `Failed to sign message: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Sign a transaction
     */
    @Post('sign-transaction')
    @SuccessResponse('200', 'Transaction signed successfully')
    @Example<SigningResponse>({
        success: true,
        signedTransaction:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        chainId: 1,
        chainName: 'Ethereum',
    })
    public async signTransaction(
        @Body() body: SignTransactionRequest,
        @Request() request: ExpressRequest,
    ): Promise<SigningResponse> {
        const { wallet: basicWallet } = (request as any).user;

        const completeWallet = await Wallet.findOne({
            address: basicWallet.address,
        }).select('+encryptedPrivateKey +encryptionSalt');

        try {
            if (completeWallet?.encryptedPrivateKey) {
                const privateKey =
                    completeWallet.encryptedPrivateKey as `0x${string}`;
                const result = await this.signingService.signTransaction(
                    body,
                    privateKey,
                );

                if (result.success) {
                    return result;
                } else {
                    throw new ApiError(
                        400,
                        'SIGNING_FAILED',
                        result.error || 'Failed to sign transaction',
                    );
                }
            } else {
                throw new ApiError(
                    400,
                    'WALLET_ERROR',
                    'No wallet found or private key not available',
                );
            }
        } catch (error) {
            console.error('Error signing transaction:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                500,
                'SIGNING_ERROR',
                `Failed to sign transaction: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Sign typed data (EIP-712)
     */
    @Post('sign-typed-data')
    @SuccessResponse('200', 'Typed data signed successfully')
    @Example<SigningResponse>({
        success: true,
        signature:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        chainId: 1,
        chainName: 'Ethereum',
    })
    public async signTypedData(
        @Body() body: SignTypedDataRequest,
        @Request() request: ExpressRequest,
    ): Promise<SigningResponse> {
        const { wallet: basicWallet } = (request as any).user;

        const completeWallet = await Wallet.findOne({
            address: basicWallet.address,
        }).select('+encryptedPrivateKey +encryptionSalt');

        try {
            if (completeWallet?.encryptedPrivateKey) {
                const privateKey =
                    completeWallet.encryptedPrivateKey as `0x${string}`;
                const result = await this.signingService.signTypedData(
                    body,
                    privateKey,
                );

                if (result.success) {
                    return result;
                } else {
                    throw new ApiError(
                        400,
                        'SIGNING_FAILED',
                        result.error || 'Failed to sign typed data',
                    );
                }
            } else {
                throw new ApiError(
                    400,
                    'WALLET_ERROR',
                    'No wallet found or private key not available',
                );
            }
        } catch (error) {
            console.error('Error signing typed data:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                500,
                'SIGNING_ERROR',
                `Failed to sign typed data: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Send a signed transaction
     */
    @Post('send-signed-transaction')
    @SuccessResponse('200', 'Transaction sent successfully')
    @Example<{ success: boolean; transactionHash?: string; error?: string }>({
        success: true,
        transactionHash:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    })
    public async sendSignedTransaction(
        @Body() body: SendSignedTransactionRequest,
    ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
        try {
            const result = await this.signingService.sendSignedTransaction(
                body.chainId,
                body.signedTransaction,
            );

            if (result.success) {
                return result;
            } else {
                throw new ApiError(
                    400,
                    'SEND_FAILED',
                    result.error || 'Failed to send transaction',
                );
            }
        } catch (error) {
            console.error('Error sending signed transaction:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                500,
                'SEND_ERROR',
                `Failed to send transaction: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Verify a message signature
     */
    @Post('verify-message')
    @SuccessResponse('200', 'Message verified successfully')
    @Example<{
        success: boolean;
        isValid: boolean;
        recoveredAddress?: string;
        error?: string;
    }>({
        success: true,
        isValid: true,
        recoveredAddress: '0x742E6B6D8B6C4e8D8e8D8e8D8e8D8e8D8e8D8e8D',
    })
    public async verifyMessage(@Body() body: VerifyMessageRequest): Promise<{
        success: boolean;
        isValid: boolean;
        recoveredAddress?: string;
        error?: string;
    }> {
        try {
            const result = await this.signingService.verifyMessage(
                body.chainId,
                body.message,
                body.signature,
                body.address,
            );

            return result;
        } catch (error) {
            console.error('Error verifying message:', error);
            throw new ApiError(
                500,
                'VERIFICATION_ERROR',
                `Failed to verify message: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }
}

// Export the instance for use in routes
const signingController = new SigningController();
export default signingController;
