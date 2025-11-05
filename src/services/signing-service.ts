// src/services/signing-service.ts
import {
    createPublicClient,
    createWalletClient,
    http,
    type WalletClient,
    type PublicClient,
    type TransactionRequest,
    parseEther,
    verifyMessage,
    recoverMessageAddress,
    verifyTypedData,
    recoverTypedDataAddress,
    type Account,
    type Chain,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAINS, getChainConfig } from '../config/chains';
import {
    SignMessageRequest,
    SignTransactionRequest,
    SignTypedDataRequest,
    SigningResponse,
} from '../types/signing-types';

// Define a proper wallet client type that includes account
type WalletClientWithAccount = WalletClient & {
    account: Account;
};

export class SigningService {
    private publicClients: Map<number, PublicClient> = new Map();
    private walletClients: Map<string, WalletClientWithAccount> = new Map();

    /**
     * Get or create public client for a chain
     */
    private getPublicClient(chainId: number): PublicClient {
        if (!this.publicClients.has(chainId)) {
            const config = getChainConfig(chainId);

            // Create public client with proper typing
            const publicClient = createPublicClient({
                chain: config.chain as Chain, // Explicitly cast to Chain type
                transport: http(config.rpcUrl),
            });

            this.publicClients.set(chainId, publicClient);
        }
        return this.publicClients.get(chainId)!;
    }

    /**
     * Get or create wallet client for a chain
     */
    private getWalletClient(
        chainId: number,
        privateKey: `0x${string}`,
    ): WalletClientWithAccount {
        const key = `${chainId}-${privateKey}`;
        if (!this.walletClients.has(key)) {
            const config = getChainConfig(chainId);
            const account = privateKeyToAccount(privateKey);

            const walletClient = createWalletClient({
                account,
                chain: config.chain as Chain, // Explicitly cast to Chain type
                transport: http(config.rpcUrl),
            });

            // Cast to our custom type that guarantees account exists
            this.walletClients.set(
                key,
                walletClient as WalletClientWithAccount,
            );
        }
        return this.walletClients.get(key)!;
    }

    /**
     * Sign a raw message (EIP-191)
     */
    public async signMessage(
        request: SignMessageRequest,
        privateKey: `0x${string}`,
    ): Promise<SigningResponse> {
        try {
            const config = getChainConfig(request.chainId);
            const walletClient = this.getWalletClient(
                request.chainId,
                privateKey,
            );

            const signature = await walletClient.signMessage({
                account: walletClient.account,
                message: request.message,
            });

            // Verify the signature
            const recoveredAddress = await recoverMessageAddress({
                message: request.message,
                signature,
            });

            const signerAddress = walletClient.account.address;
            const isValid =
                recoveredAddress.toLowerCase() === signerAddress.toLowerCase();

            if (!isValid) {
                return {
                    success: false,
                    error: 'Signature verification failed',
                    chainId: request.chainId,
                    chainName: config.chain.name,
                };
            }

            return {
                success: true,
                signature,
                chainId: request.chainId,
                chainName: config.chain.name,
            };
        } catch (error) {
            console.error('Error signing message:', error);
            return {
                success: false,
                error: `Failed to sign message: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
                chainId: request.chainId,
            };
        }
    }

    /**
     * Sign a transaction
     */
    public async signTransaction(
        request: SignTransactionRequest,
        privateKey: `0x${string}`,
    ): Promise<SigningResponse> {
        try {
            const config = getChainConfig(request.chainId);
            const publicClient = this.getPublicClient(request.chainId);
            const walletClient = this.getWalletClient(
                request.chainId,
                privateKey,
            );

            // Get nonce if not provided
            const nonce =
                request.nonce ??
                (await publicClient.getTransactionCount({
                    address: walletClient.account.address,
                    blockTag: 'pending',
                }));

            // Build transaction parameters without using TransactionRequest type
            const transactionParameters = {
                to: request.to as `0x${string}`,
                value: parseEther(request.value),
                data: request.data as `0x${string}` | undefined,
                gas: BigInt(request.gasLimit),
                nonce,
                chainId: request.chainId, // Include chainId here for signing
            };

            // Add gas pricing based on chain support
            if (request.maxFeePerGas && request.maxPriorityFeePerGas) {
                (transactionParameters as any).maxFeePerGas = BigInt(
                    request.maxFeePerGas,
                );
                (transactionParameters as any).maxPriorityFeePerGas = BigInt(
                    request.maxPriorityFeePerGas,
                );
            } else if (request.gasPrice) {
                (transactionParameters as any).gasPrice = BigInt(
                    request.gasPrice,
                );
            } else {
                // Get current gas price
                (transactionParameters as any).gasPrice =
                    await publicClient.getGasPrice();
            }

            // Sign transaction using explicit parameters
            const signedTransaction = await walletClient.signTransaction({
                account: walletClient.account,
                chain: walletClient.chain,
                ...transactionParameters,
            } as any); // Use any to bypass strict type checking

            return {
                success: true,
                signedTransaction,
                chainId: request.chainId,
                chainName: config.chain.name,
            };
        } catch (error) {
            console.error('Error signing transaction:', error);
            return {
                success: false,
                error: `Failed to sign transaction: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
                chainId: request.chainId,
            };
        }
    }

    /**
     * Sign typed data (EIP-712)
     */
    public async signTypedData(
        request: SignTypedDataRequest,
        privateKey: `0x${string}`,
    ): Promise<SigningResponse> {
        try {
            const config = getChainConfig(request.chainId);
            const walletClient = this.getWalletClient(
                request.chainId,
                privateKey,
            );

            // Prepare domain with proper type conversions
            const domain: any = {
                ...request.domain,
                chainId: request.chainId,
            };

            // Convert string salt to hex if provided
            if (
                request.domain.salt &&
                typeof request.domain.salt === 'string'
            ) {
                domain.salt = `0x${Buffer.from(request.domain.salt).toString(
                    'hex',
                )}`;
            }

            // Ensure verifyingContract is properly formatted
            if (
                request.domain.verifyingContract &&
                typeof request.domain.verifyingContract === 'string'
            ) {
                // Ensure it starts with 0x and is the correct length
                let contractAddress = request.domain.verifyingContract;
                if (!contractAddress.startsWith('0x')) {
                    contractAddress = `0x${contractAddress}`;
                }
                // Basic validation for Ethereum address format
                if (/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
                    domain.verifyingContract = contractAddress as `0x${string}`;
                }
            }

            const signature = await walletClient.signTypedData({
                account: walletClient.account,
                domain,
                types: request.types,
                primaryType: request.primaryType,
                message: request.message,
            } as any); // Use any to bypass strict type checking

            // Verify the signature
            const recoveredAddress = await recoverTypedDataAddress({
                domain,
                types: request.types,
                primaryType: request.primaryType,
                message: request.message,
                signature,
            });

            const signerAddress = walletClient.account.address;
            const isValid =
                recoveredAddress.toLowerCase() === signerAddress.toLowerCase();

            if (!isValid) {
                return {
                    success: false,
                    error: 'Typed data signature verification failed',
                    chainId: request.chainId,
                    chainName: config.chain.name,
                };
            }

            return {
                success: true,
                signature,
                chainId: request.chainId,
                chainName: config.chain.name,
            };
        } catch (error) {
            console.error('Error signing typed data:', error);
            return {
                success: false,
                error: `Failed to sign typed data: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
                chainId: request.chainId,
            };
        }
    }

    /**
     * Send a signed transaction
     */
    public async sendSignedTransaction(
        chainId: number,
        signedTransaction: string,
    ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
        try {
            const publicClient = this.getPublicClient(chainId);

            const hash = await publicClient.sendRawTransaction({
                serializedTransaction: signedTransaction as `0x${string}`,
            });

            return {
                success: true,
                transactionHash: hash,
            };
        } catch (error) {
            console.error('Error sending signed transaction:', error);
            return {
                success: false,
                error: `Failed to send transaction: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            };
        }
    }

    /**
     * Verify a message signature
     */
    public async verifyMessage(
        chainId: number,
        message: string,
        signature: string,
        address?: string,
    ): Promise<{
        success: boolean;
        isValid: boolean;
        recoveredAddress?: string;
        error?: string;
    }> {
        try {
            const recoveredAddress = await recoverMessageAddress({
                message,
                signature: signature as `0x${string}`,
            });

            const isValid = address
                ? recoveredAddress.toLowerCase() === address.toLowerCase()
                : true;

            return {
                success: true,
                isValid,
                recoveredAddress,
            };
        } catch (error) {
            console.error('Error verifying message:', error);
            return {
                success: false,
                isValid: false,
                error: `Failed to verify message: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            };
        }
    }

    /**
     * Get supported chains
     */
    public getSupportedChains() {
        return Object.values(CHAINS).map((config) => ({
            chainId: config.chain.id,
            name: config.chain.name,
            testnet: config.testnet,
            currency: config.currency,
            explorerUrl: config.explorerUrl,
            rpcUrl: config.rpcUrl,
        }));
    }

    /**
     * Get chain info
     */
    public getChainInfo(chainId: number) {
        const config = getChainConfig(chainId);
        return {
            chainId: config.chain.id,
            name: config.chain.name,
            testnet: config.testnet,
            currency: config.currency,
            explorerUrl: config.explorerUrl,
            rpcUrl: config.rpcUrl,
            nativeCurrency: config.chain.nativeCurrency,
        };
    }
}

const signingService = new SigningService();
export default signingService;
