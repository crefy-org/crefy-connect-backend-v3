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
import ENSSubnameService, {
    createSepoliaENSSubnameService,
} from '../services/ens-subname-service';
import { createWalletClient, http, WalletClient } from 'viem';
import { Wallet } from '../models/wallet-models';
import { privateKeyToAccount } from 'viem/accounts';
import { IWalletLean } from '../types';
import { sepolia } from 'viem/chains';

// Request interfaces
interface CheckSubnameRequest {
    label: string;
}

interface ClaimSubnameRequest {
    label: string;
}

interface GetUserSubnamesRequest {
    userAddress: string;
}

interface CheckSubnameResponse {
    success: boolean;
    isClaimed: boolean;
    owner?: string;
    node?: string;
}

interface ClaimSubnameResponse {
    success: boolean;
    message: string;
    node?: string | undefined;
    transactionHash?: string | undefined;
}

interface SubnameOwnershipInfoResponse {
    success: boolean;
    owner: string;
    isClaimed: boolean;
    node: string;
}

interface UserSubnamesResponse {
    success: boolean;
    subnames: string[];
    count: number;
}

interface AllSubnamesResponse {
    success: boolean;
    subnames: string[];
    count: number;
}

interface ServiceStatusResponse {
    success: boolean;
    connected: boolean;
    contractOwner: string;
    parentNode: string;
}

@Route('/ens/subnames')
@Tags('Ens Subname Service')
@Security('app')
@Security('bearer')
export class ENSSubnameController extends Controller {
    private ensService: ENSSubnameService;

    constructor() {
        super();

        // Use public Sepolia RPC - no API key needed
        const sepoliaRpcUrl =
            process.env.ETHEREUM_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

        this.ensService = createSepoliaENSSubnameService(
            (process.env
                .ENS_L1_SUBNAME_REGISTRAR_CONTRACT_ADDRESS as `0x${string}`) ||
                ('0x062D64Eb51f906d4cFfEf3F2954866197c63c648' as `0x${string}`),
            (process.env.ENS_PARENT_NODE as `0x${string}`) ||
                ('0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`),
            sepoliaRpcUrl,
        );
    }

    /**
     * Check if a subname is available
     * @example requestBody {"label": "myname"}
     */
    @Post('check')
    @SuccessResponse('200', 'Subname availability checked successfully')
    @Example<CheckSubnameResponse>({
        success: true,
        isClaimed: false,
        owner: '0x0000000000000000000000000000000000000000',
        node: '0x6d796e616d650000000000000000000000000000000000000000000000000000',
    })
    @Response('400', 'Invalid label')
    @Response('500', 'Service error')
    public async checkSubname(
        @Body() body: CheckSubnameRequest,
        @Request() request: ExpressRequest,
    ): Promise<CheckSubnameResponse> {
        const { app } = (request as any).user;
        const { label } = body;

        this.validateLabelInput(label);

        try {
            const ownershipInfo =
                await this.ensService.getSubnameOwnershipInfo(label);

            console.log('ownership: ', ownershipInfo);

            return {
                success: true,
                isClaimed: ownershipInfo.isClaimed,
                owner: ownershipInfo.owner,
                node: ownershipInfo.node,
            };
        } catch (error: any) {
            console.error('Error checking subname:', error);
            throw new ApiError(
                500,
                'SERVICE_ERROR',
                `Failed to check subname: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Claim subname
     * Note: This requires a connected wallet with ETH <sepolia or mainet>
     * @example requestBody {"label":  "myname"}
     */
    @Post('claim')
    @SuccessResponse('200', 'Subname claimed successfully')
    @Example<ClaimSubnameResponse>({
        success: true,
        message: 'Subname claimed successfully',
        node: '0x6d796e616d650000000000000000000000000000000000000000000000000000',
        transactionHash:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    })
    @Response('400', 'Subname already claimed or invalid input')
    @Response('500', 'Claim failed')
    public async claimSubname(
        @Body() body: ClaimSubnameRequest,
        @Request() request: ExpressRequest,
    ): Promise<ClaimSubnameResponse> {
        const { wallet: basicWallet } = (request as any).user;
        const { label } = body;

        this.validateLabelInput(label);

        const completeWallet = await Wallet.findOne({
            address: basicWallet.address,
        }).select('+encryptedPrivateKey +encryptionSalt');

        try {
            if (completeWallet?.encryptedPrivateKey) {
                const account = privateKeyToAccount(
                    completeWallet.encryptedPrivateKey as `0x${string}`,
                );

                const sepoliaRpcUrl =
                    process.env.ETHEREUM_SEPOLIA_RPC_URL ||
                    'https://rpc.sepolia.org';

                const walletClient = createWalletClient({
                    account,
                    chain: sepolia,
                    transport: http(sepoliaRpcUrl),
                });

                // FIX: Initialize the service with the wallet client
                this.ensService.setWalletClient(walletClient);

                const result = await this.ensService.claimSubnameWithPrivateKey(
                    label,
                    completeWallet.encryptedPrivateKey as `0x${string}`,
                );

                if (result.success) {
                    return {
                        success: true,
                        message: 'Subname claimed successfully on Sepolia',
                        node: result.node,
                        transactionHash: result.transactionHash,
                    };
                } else {
                    throw new ApiError(
                        400,
                        'CLAIM_FAILED',
                        result.error || 'Failed to claim subname',
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
            console.error('Error claiming subname:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(
                500,
                'CLAIM_ERROR',
                `Failed to claim subname: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get all subnames claimed by a user on Sepolia
     * @example query {"userAddress": "0x742E6B6D8B6C4e8D8e8D8e8D8e8D8e8D8e8D8e8D"}
     */
    @Get('user')
    @SuccessResponse('200', 'User subnames retrieved successfully')
    @Example<UserSubnamesResponse>({
        success: true,
        subnames: ['alice', 'bob', 'charlie'],
        count: 3,
    })
    @Response('400', 'Invalid user address')
    @Response('500', 'Service error')
    public async getUserSubnames(
        @Query() userAddress: string,
        @Request() request: ExpressRequest,
    ): Promise<UserSubnamesResponse> {
        console.log(request);
        const { app } = (request as any).user;
        console.log('app', app);

        this.validateAddressInput(userAddress);

        try {
            const subnames = await this.ensService.getUserSubnames(
                userAddress as `0x${string}`,
            );

            return {
                success: true,
                subnames,
                count: subnames.length,
            };
        } catch (error) {
            console.error('Error getting user subnames:', error);
            throw new ApiError(
                500,
                'SERVICE_ERROR',
                `Failed to get user subnames: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get all registered subnames on Sepolia
     */
    @Get('all')
    @SuccessResponse('200', 'All subnames retrieved successfully')
    @Example<AllSubnamesResponse>({
        success: true,
        subnames: ['alice', 'bob', 'charlie', 'dave'],
        count: 4,
    })
    @Response('500', 'Service error')
    public async getAllSubnames(
        @Request() request: ExpressRequest,
    ): Promise<AllSubnamesResponse> {
        const { app } = (request as any).user;

        try {
            const subnames = await this.ensService.getAllSubnames();

            return {
                success: true,
                subnames,
                count: subnames.length,
            };
        } catch (error) {
            console.error('Error getting all subnames:', error);
            throw new ApiError(
                500,
                'SERVICE_ERROR',
                `Failed to get all subnames: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get Sepolia service status and contract information
     */
    @Get('status')
    @SuccessResponse('200', 'Service status retrieved successfully')
    @Example<ServiceStatusResponse>({
        success: true,
        connected: true,
        contractOwner: '0x742E6B6D8B6C4e8D8e8D8e8D8e8D8e8D8e8D8e8D',
        parentNode:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    })
    @Response('500', 'Service error')
    public async getServiceStatus(
        @Request() request: ExpressRequest,
    ): Promise<ServiceStatusResponse> {
        const { app } = (request as any).user;

        try {
            const [connected, contractOwner, parentNode] = await Promise.all([
                this.ensService.verifyConnection(),
                this.ensService.getContractOwner(),
                this.ensService.getParentNode(),
            ]);

            return {
                success: true,
                connected,
                contractOwner,
                parentNode,
            };
        } catch (error) {
            console.error('Error getting service status:', error);
            throw new ApiError(
                500,
                'SERVICE_ERROR',
                `Failed to get service status: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Check if user has claimed any subnames on Sepolia
     * @example query {"userAddress": "0x742E6B6D8B6C4e8D8e8D8e8D8e8D8e8D8e8D8e8D"}
     */
    @Get('has-claimed')
    @SuccessResponse('200', 'Claim status checked successfully')
    @Example<{ success: boolean; hasClaimed: boolean }>({
        success: true,
        hasClaimed: true,
    })
    @Response('400', 'Invalid user address')
    @Response('500', 'Service error')
    public async hasUserClaimedSubname(
        @Query() userAddress: string,
        @Request() request: ExpressRequest,
    ): Promise<{ success: boolean; hasClaimed: boolean }> {
        const { app } = (request as any).user;

        this.validateAddressInput(userAddress);

        try {
            const hasClaimed = await this.ensService.hasUserClaimedSubname(
                userAddress as `0x${string}`,
            );

            return {
                success: true,
                hasClaimed,
            };
        } catch (error) {
            console.error('Error checking claim status:', error);
            throw new ApiError(
                500,
                'SERVICE_ERROR',
                `Failed to check claim status: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get Sepolia network information
     */
    @Get('network-info')
    @SuccessResponse('200', 'Network information retrieved')
    @Example<{
        success: boolean;
        network: string;
        chainId: number;
        blockExplorer: string;
        testnet: boolean;
    }>({
        success: true,
        network: 'Sepolia',
        chainId: 11155111,
        blockExplorer: 'https://sepolia.etherscan.io',
        testnet: true,
    })
    public async getNetworkInfo(): Promise<{
        success: boolean;
        network: string;
        chainId: number;
        blockExplorer: string;
        testnet: boolean;
    }> {
        return {
            success: true,
            network: 'Sepolia',
            chainId: 11155111,
            blockExplorer: 'https://sepolia.etherscan.io',
            testnet: true,
        };
    }

    // Private helper methods

    private validateLabelInput(label: string): void {
        if (!label || label.trim().length === 0) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'Label is required');
        }

        if (label.length > 50) {
            throw new ApiError(
                400,
                'VALIDATION_ERROR',
                'Label must be less than 50 characters',
            );
        }

        // Basic validation for ENS labels (alphanumeric and hyphens)
        const labelRegex = /^[a-z0-9-]+$/;
        if (!labelRegex.test(label)) {
            throw new ApiError(
                400,
                'VALIDATION_ERROR',
                'Label can only contain lowercase letters, numbers, and hyphens',
            );
        }
    }

    private validateAddressInput(address: string): void {
        if (!address || address.trim().length === 0) {
            throw new ApiError(400, 'VALIDATION_ERROR', 'Address is required');
        }

        // Basic Ethereum address validation
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!addressRegex.test(address)) {
            throw new ApiError(
                400,
                'VALIDATION_ERROR',
                'Invalid Ethereum address format',
            );
        }
    }

    /**
     * Initialize service with wallet client for write operations
     * This should be called when a user connects their wallet
     */
    public initializeWithWallet(walletClient: any): void {
        this.ensService.setWalletClient(walletClient);
    }
}

export default new ENSSubnameController();
