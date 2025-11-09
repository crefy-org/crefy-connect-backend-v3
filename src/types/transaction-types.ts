export interface SendTransactionRequest {
    fromAddress: string;
    toAddress: string;
    value: string;
    chainId: number;
    tokenAddress?: string | undefined; // If undefined, send native token
    gasLimit?: string | undefined;
    maxFeePerGas?: string | undefined;
    maxPriorityFeePerGas?: string | undefined;
    nonce?: number | undefined;
}

export interface SendTransactionResponse {
    success: boolean;
    transactionHash?: string;
    fromAddress: string;
    toAddress: string;
    value: string;
    chainId: number;
    chainName: string;
    tokenAddress?: string | undefined;
    error?: string | undefined;
}

export interface TransactionHistoryRequest {
    walletAddress: string;
    chainId: number;
    page?: number;
    limit?: number;
}

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: number;
    blockNumber: number;
    status: 'success' | 'failed' | 'pending';
    gasUsed: string;
    gasPrice: string;
    tokenTransfers?: TokenTransfer[];
}

export interface TokenTransfer {
    tokenAddress: string;
    from: string;
    to: string;
    value: string;
    tokenSymbol: string;
    tokenDecimals: number;
}

export interface TransactionHistoryResponse {
    success: boolean;
    transactions: Transaction[];
    walletAddress: string;
    chainId: number;
    chainName: string;
    page: number;
    limit: number;
    total: number;
    error?: string | undefined;
}

export interface GasPriceResponse {
    success: boolean;
    gasPrice?: string;
    maxFeePerGas?: string | undefined;
    maxPriorityFeePerGas?: string | undefined;
    chainId: number;
    chainName: string;
    error?: string | undefined;
}

export interface TransactionStatusResponse {
    success: boolean;
    transactionHash: string;
    status: 'success' | 'failed' | 'pending';
    blockNumber?: number | undefined;
    confirmations: number;
    gasUsed?: string;
    error?: string | undefined;
}
