/// <reference path="../types/global.d.ts" />
import {
    createPublicClient,
    http,
    formatUnits,
    type PublicClient,
    type Chain,
} from 'viem';
import { CHAINS, getChainConfig } from '../config/chains';
import {
    BalanceRequest,
    BalanceResponse,
    TokenBalance,
    NativeBalanceRequest,
    NativeBalanceResponse,
    TokenBalanceResponse,
} from '../types/balance-types';

// Standard ERC20 ABI
const erc20Abi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
] as const;

export class BalanceService {
    private publicClients: Map<number, PublicClient> = new Map();

    /**
     * Get or create public client for a chain
     */
    private getPublicClient(chainId: number): PublicClient {
        if (!this.publicClients.has(chainId)) {
            const config = getChainConfig(chainId);

            const publicClient = createPublicClient({
                chain: config.chain as Chain,
                transport: http(config.rpcUrl),
            });

            this.publicClients.set(chainId, publicClient);
        }
        return this.publicClients.get(chainId)!;
    }

    /**
     * Validate and format Ethereum address
     */
    private validateAddress(address: string): `0x${string}` {
        if (!address.startsWith('0x') || address.length !== 42) {
            throw new Error(`Invalid Ethereum address: ${address}`);
        }
        return address as `0x${string}`;
    }

    /**
     * Get native balance (ETH, MATIC, etc.)
     */
    public async getNativeBalance(
        request: NativeBalanceRequest,
    ): Promise<NativeBalanceResponse> {
        try {
            const chainId = request.chainId || 8453; // Default to Base
            const publicClient = this.getPublicClient(chainId);

            const validatedAddress = this.validateAddress(
                request.walletAddress,
            );

            const rawBalance = await publicClient.getBalance({
                address: validatedAddress,
            });

            const config = getChainConfig(chainId);
            const balance = formatUnits(
                rawBalance,
                config.chain.nativeCurrency.decimals,
            );

            return {
                success: true,
                balance,
            };
        } catch (error) {
            console.error('Error fetching native balance:', error);
            return {
                success: false,
                balance: '0',
                error: `Failed to fetch native balance: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            };
        }
    }

    /**
     * Get token balance for a specific ERC20 token
     */
    public async getTokenBalance(
        walletAddress: string,
        tokenAddress: string,
        chainId: number = 8453,
    ): Promise<TokenBalanceResponse> {
        try {
            const publicClient = this.getPublicClient(chainId);

            const validatedWalletAddress = this.validateAddress(walletAddress);
            const validatedTokenAddress = this.validateAddress(tokenAddress);

            // Use type assertions to handle the Promise<unknown> conversion
            const [symbol, decimals, rawBalance, name] = await Promise.all([
                publicClient.readContract({
                    address: validatedTokenAddress,
                    abi: erc20Abi,
                    functionName: 'symbol',
                }) as Promise<string>,
                publicClient.readContract({
                    address: validatedTokenAddress,
                    abi: erc20Abi,
                    functionName: 'decimals',
                }) as Promise<number>,
                publicClient.readContract({
                    address: validatedTokenAddress,
                    abi: erc20Abi,
                    functionName: 'balanceOf',
                    args: [validatedWalletAddress],
                }) as Promise<bigint>,
                publicClient
                    .readContract({
                        address: validatedTokenAddress,
                        abi: erc20Abi,
                        functionName: 'name',
                    })
                    .catch(() => 'Unknown Token') as Promise<string>,
            ]);

            const formattedBalance = formatUnits(rawBalance, decimals);

            const tokenBalance: TokenBalance = {
                symbol,
                balance: rawBalance.toString(),
                formattedBalance,
                decimals,
                tokenAddress: validatedTokenAddress,
                isNative: false,
                name,
            };

            return {
                success: true,
                tokenBalance,
            };
        } catch (error) {
            console.error('Error fetching token balance:', error);
            return {
                success: false,
                error: `Failed to fetch token balance: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            };
        }
    }

    /**
     * Get all balances - native + specified tokens
     */
    public async getBalances(
        request: BalanceRequest,
    ): Promise<BalanceResponse> {
        try {
            const chainId = request.chainId || 8453; // Default to Base
            const config = getChainConfig(chainId);

            // Validate wallet address
            const validatedWalletAddress = this.validateAddress(
                request.walletAddress,
            );

            // Get native balance
            const nativeBalanceResult = await this.getNativeBalance({
                walletAddress: validatedWalletAddress,
                chainId,
            });

            if (!nativeBalanceResult.success) {
                return {
                    success: false,
                    walletAddress: validatedWalletAddress,
                    nativeBalance: '0',
                    tokenBalances: [],
                    chainId,
                    chainName: config.chain.name,
                    error: nativeBalanceResult.error,
                };
            }

            const tokenBalances: TokenBalance[] = [];

            // Add native balance as a token balance for consistency
            tokenBalances.push({
                symbol: config.chain.nativeCurrency.symbol,
                balance: '0', // We don't have the raw balance here
                formattedBalance: nativeBalanceResult.balance,
                decimals: config.chain.nativeCurrency.decimals,
                tokenAddress: '0x0000000000000000000000000000000000000000',
                isNative: true,
                name: config.chain.nativeCurrency.name,
            });

            // Get specified token balance if provided
            if (request.tokenAddress) {
                const tokenBalanceResult = await this.getTokenBalance(
                    validatedWalletAddress,
                    request.tokenAddress,
                    chainId,
                );

                if (
                    tokenBalanceResult.success &&
                    tokenBalanceResult.tokenBalance
                ) {
                    tokenBalances.push(tokenBalanceResult.tokenBalance);
                }
            }

            return {
                success: true,
                walletAddress: validatedWalletAddress,
                nativeBalance: nativeBalanceResult.balance,
                tokenBalances,
                chainId,
                chainName: config.chain.name,
            };
        } catch (error) {
            console.error('Error fetching balances:', error);
            return {
                success: false,
                walletAddress: request.walletAddress,
                nativeBalance: '0',
                tokenBalances: [],
                chainId: request.chainId || 8453,
                chainName: getChainConfig(request.chainId || 8453).chain.name,
                error: `Failed to fetch balances: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            };
        }
    }

    /**
     * Get multiple token balances at once
     */
    public async getMultipleTokenBalances(
        walletAddress: string,
        tokenAddresses: string[],
        chainId: number = 8453,
    ): Promise<{
        success: boolean;
        tokenBalances: TokenBalance[];
        error?: string | undefined;
    }> {
        try {
            const validatedWalletAddress = this.validateAddress(walletAddress);
            const validatedTokenAddresses = tokenAddresses.map((addr) =>
                this.validateAddress(addr),
            );

            const balancePromises = validatedTokenAddresses.map(
                (tokenAddress) =>
                    this.getTokenBalance(
                        validatedWalletAddress,
                        tokenAddress,
                        chainId,
                    ),
            );

            const results = await Promise.all(balancePromises);

            const tokenBalances: TokenBalance[] = [];
            const errors: string[] = [];

            results.forEach((result: any, index: any) => {
                if (result.success && result.tokenBalance) {
                    tokenBalances.push(result.tokenBalance);
                } else if (result.error) {
                    errors.push(
                        `Token ${tokenAddresses[index]}: ${result.error}`,
                    );
                }
            });

            return {
                success: errors.length === 0,
                tokenBalances,
                error: errors.length > 0 ? errors.join('; ') : undefined,
            };
        } catch (error) {
            console.error('Error fetching multiple token balances:', error);
            return {
                success: false,
                tokenBalances: [],
                error: `Failed to fetch multiple token balances: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            };
        }
    }

    /**
     * Get supported chains for balance checking
     */
    public getSupportedChains() {
        return Object.values(CHAINS).map((config) => ({
            chainId: config.chain.id,
            name: config.chain.name,
            testnet: config.testnet,
            currency: config.currency,
            explorerUrl: config.explorerUrl,
            rpcUrl: config.rpcUrl,
            nativeCurrency: config.chain.nativeCurrency,
        }));
    }
}

const balanceService = new BalanceService();
export default balanceService;
