/// <reference path="../types/global.d.ts" />
import {
    Controller,
    Post,
    Get,
    Route,
    Tags,
    Body,
    Query,
    SuccessResponse,
    Example,
    Security,
} from 'tsoa';
import { ApiError } from '../utils/ApiError';
import { BalanceService } from '../services/balance-service';
import { getChainConfig } from '../config/chains';
import {
    BalanceRequest,
    BalanceResponse,
    NativeBalanceRequest,
    TokenBalance,
    SupportedChainsResponse,
    MultipleTokensRequest,
    MultipleTokensResponse,
    NativeBalanceResponse,
    TokenBalanceResponse,
} from '../types/balance-types';

// Example data for Swagger
const exampleBalanceResponse: BalanceResponse = {
    success: true,
    walletAddress: '0xa5E0Da329eE5AA03f09228e534953496334080f5',
    nativeBalance: '0.125',
    tokenBalances: [
        {
            symbol: 'ETH',
            balance: '125000000000000000',
            formattedBalance: '0.125',
            decimals: 18,
            tokenAddress: '0x0000000000000000000000000000000000000000',
            isNative: true,
            name: 'Ethereum',
        },
        {
            symbol: 'USDC',
            balance: '1500000000',
            formattedBalance: '1500.00',
            decimals: 6,
            tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            isNative: false,
            name: 'USD Coin',
        },
    ],
    chainId: 8453,
    chainName: 'Base',
};

@Route('balance')
@Tags('Balance Service')
@Security('app')
@Security('bearer')
export class BalanceController extends Controller {
    private balanceService: BalanceService;

    constructor() {
        super();
        this.balanceService = new BalanceService();
    }

    /**
     * Get all supported chains for balance checking
     */
    @Get('chains')
    @SuccessResponse('200', 'Supported chains retrieved successfully')
    @Example<SupportedChainsResponse>({
        success: true,
        chains: [
            {
                chainId: 8453,
                name: 'Base',
                testnet: false,
                currency: 'ETH',
                explorerUrl: 'https://basescan.org',
                rpcUrl: 'https://mainnet.base.org',
                nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                },
            },
        ],
    })
    public async getSupportedChains(): Promise<SupportedChainsResponse> {
        try {
            const chains = this.balanceService.getSupportedChains();
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
     * Get native balance only
     */
    @Post('native')
    @SuccessResponse('200', 'Native balance retrieved successfully')
    @Example<NativeBalanceResponse>({
        success: true,
        balance: '0.125',
    })
    public async getNativeBalance(
        @Body() body: NativeBalanceRequest,
    ): Promise<NativeBalanceResponse> {
        try {
            // Validate wallet address format
            if (
                !body.walletAddress.startsWith('0x') ||
                body.walletAddress.length !== 42
            ) {
                throw new ApiError(
                    400,
                    'INVALID_ADDRESS',
                    'Invalid wallet address format',
                );
            }

            const result = await this.balanceService.getNativeBalance(body);

            if (result.success) {
                return result;
            } else {
                throw new ApiError(
                    400,
                    'BALANCE_FETCH_FAILED',
                    result.error || 'Failed to fetch native balance',
                );
            }
        } catch (error) {
            console.error('Error fetching native balance:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                500,
                'BALANCE_ERROR',
                `Failed to fetch native balance: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get token balance for a specific ERC20 token
     */
    @Post('token')
    @SuccessResponse('200', 'Token balance retrieved successfully')
    @Example<TokenBalanceResponse>({
        success: true,
        tokenBalance: {
            symbol: 'USDC',
            balance: '1500000000',
            formattedBalance: '1500.00',
            decimals: 6,
            tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            isNative: false,
            name: 'USD Coin',
        },
    })
    public async getTokenBalance(
        @Query() walletAddress: string,
        @Query() tokenAddress: string,
        @Query() chainId?: string,
    ): Promise<TokenBalanceResponse> {
        try {
            // Validate addresses
            if (
                !walletAddress.startsWith('0x') ||
                walletAddress.length !== 42
            ) {
                throw new ApiError(
                    400,
                    'INVALID_WALLET_ADDRESS',
                    'Invalid wallet address format',
                );
            }
            if (!tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
                throw new ApiError(
                    400,
                    'INVALID_TOKEN_ADDRESS',
                    'Invalid token address format',
                );
            }

            const chainIdNumber = chainId ? parseInt(chainId, 10) : 8453;

            const result = await this.balanceService.getTokenBalance(
                walletAddress,
                tokenAddress,
                chainIdNumber,
            );

            if (result.success) {
                return result;
            } else {
                throw new ApiError(
                    400,
                    'TOKEN_BALANCE_FETCH_FAILED',
                    result.error || 'Failed to fetch token balance',
                );
            }
        } catch (error) {
            console.error('Error fetching token balance:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                500,
                'TOKEN_BALANCE_ERROR',
                `Failed to fetch token balance: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get all balances (native + specified token)
     */
    @Post('all')
    @SuccessResponse('200', 'Balances retrieved successfully')
    @Example<BalanceResponse>(exampleBalanceResponse)
    public async getBalances(
        @Body() body: BalanceRequest,
    ): Promise<BalanceResponse> {
        try {
            // Validate wallet address
            if (
                !body.walletAddress.startsWith('0x') ||
                body.walletAddress.length !== 42
            ) {
                throw new ApiError(
                    400,
                    'INVALID_ADDRESS',
                    'Invalid wallet address format',
                );
            }

            const result = await this.balanceService.getBalances(body);

            if (result.success) {
                return result;
            } else {
                throw new ApiError(
                    400,
                    'BALANCES_FETCH_FAILED',
                    result.error || 'Failed to fetch balances',
                );
            }
        } catch (error) {
            console.error('Error fetching balances:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                500,
                'BALANCES_ERROR',
                `Failed to fetch balances: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get multiple token balances at once
     */
    @Post('multiple-tokens')
    @SuccessResponse('200', 'Multiple token balances retrieved successfully')
    @Example<MultipleTokensResponse>({
        success: true,
        walletAddress: '0xa5E0Da329eE5AA03f09228e534953496334080f5',
        tokenBalances: [
            {
                symbol: 'USDC',
                balance: '1500000000',
                formattedBalance: '1500.00',
                decimals: 6,
                tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                isNative: false,
                name: 'USD Coin',
            },
            {
                symbol: 'DAI',
                balance: '250000000000000000000',
                formattedBalance: '250.00',
                decimals: 18,
                tokenAddress: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
                isNative: false,
                name: 'Dai Stablecoin',
            },
        ],
        chainId: 8453,
        chainName: 'Base',
    })
    public async getMultipleTokenBalances(
        @Body() body: MultipleTokensRequest,
    ): Promise<MultipleTokensResponse> {
        try {
            // Validate wallet address
            if (
                !body.walletAddress.startsWith('0x') ||
                body.walletAddress.length !== 42
            ) {
                throw new ApiError(
                    400,
                    'INVALID_ADDRESS',
                    'Invalid wallet address format',
                );
            }

            // Validate token addresses
            for (const tokenAddress of body.tokenAddresses) {
                if (
                    !tokenAddress.startsWith('0x') ||
                    tokenAddress.length !== 42
                ) {
                    throw new ApiError(
                        400,
                        'INVALID_TOKEN_ADDRESS',
                        `Invalid token address: ${tokenAddress}`,
                    );
                }
            }

            const chainId = body.chainId || 8453;
            const config = getChainConfig(chainId);

            const result = await this.balanceService.getMultipleTokenBalances(
                body.walletAddress,
                body.tokenAddresses,
                chainId,
            );

            return {
                success: result.success,
                walletAddress: body.walletAddress,
                tokenBalances: result.tokenBalances,
                chainId,
                chainName: config.chain.name,
                error: result.error,
            };
        } catch (error) {
            console.error('Error fetching multiple token balances:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                500,
                'MULTIPLE_BALANCES_ERROR',
                `Failed to fetch multiple token balances: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }
}

// Export the instance for use in routes
const balanceController = new BalanceController();
export default balanceController;
