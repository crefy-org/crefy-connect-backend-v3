export interface NativeCurrency {
    name: string;
    symbol: string;
    decimals: number;
}

// Use string instead of 0x${string} for DTO interfaces to avoid TSOA errors
export interface BalanceRequest {
    walletAddress: string;
    tokenAddress?: string | undefined;
    chainId?: number | undefined;
}

export interface TokenBalance {
    symbol: string;
    balance: string;
    formattedBalance: string;
    decimals: number;
    tokenAddress: string;
    isNative: boolean;
    name?: string | undefined;
}

export interface BalanceResponse {
    success: boolean;
    walletAddress: string;
    nativeBalance: string;
    tokenBalances: TokenBalance[];
    totalValueUSD?: string | undefined;
    chainId: number;
    chainName: string;
    error?: string | undefined;
}

export interface TokenInfo {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
}

export interface NativeBalanceRequest {
    walletAddress: string;
    chainId?: number | undefined;
}

export interface NativeBalanceResponse {
    success: boolean;
    balance: string;
    error?: string | undefined;
}

export interface TokenBalanceResponse {
    success: boolean;
    tokenBalance?: TokenBalance | undefined;
    error?: string | undefined;
}

export interface MultipleTokensRequest {
    walletAddress: string;
    tokenAddresses: string[];
    chainId?: number | undefined;
}

export interface MultipleTokensResponse {
    success: boolean;
    walletAddress: string;
    tokenBalances: TokenBalance[];
    chainId: number;
    chainName: string;
    error?: string | undefined;
}

export interface SupportedChainsResponse {
    success: boolean;
    chains: Array<{
        chainId: number;
        name: string;
        testnet: boolean;
        currency: string;
        explorerUrl: string;
        rpcUrl: string;
        nativeCurrency: NativeCurrency;
    }>;
}
