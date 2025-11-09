// src/services/ens-subname-service.ts
import {
    createPublicClient,
    createWalletClient,
    http,
    type PublicClient,
    type WalletClient,
    type Address,
    type Hash,
    type Chain,
    encodeFunctionData,
} from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { L1SubnameRegistrarContractABI } from '../abis/ens/l1-subname-register-contract';
import { privateKeyToAccount } from 'viem/accounts';

// Configuration interface
interface ENSSubnameConfig {
    chain: Chain;
    rpcUrl: string;
    contractAddress: Address;
    parentNode: `0x${string}`;
}

// Subname claim result interface
interface SubnameClaimResult {
    success: boolean;
    node?: `0x${string}`;
    transactionHash?: Hash;
    error?: string;
}

// Subname ownership info interface
interface SubnameOwnershipInfo {
    owner: Address;
    isClaimed: boolean;
    node: `0x${string}`;
}

// Event filter types
interface SubnameClaimedEvent {
    node: `0x${string}`;
    label: string;
    owner: Address;
    transactionHash: Hash;
    blockNumber: bigint;
}

class ENSSubnameService {
    private publicClient: PublicClient;
    private walletClient?: WalletClient;
    private config: ENSSubnameConfig;

    constructor(config: ENSSubnameConfig, walletClient?: WalletClient) {
        this.config = config;

        // Create public client for read operations
        this.publicClient = createPublicClient({
            chain: config.chain,
            transport: http(config.rpcUrl),
        });

        // Set wallet client for write operations (optional)
        if (walletClient) {
            this.walletClient = walletClient;
        }
    }

    /**
     * Check if a subname is already claimed
     */
    public async isSubnameClaimed(label: string): Promise<boolean> {
        try {
            const node = this.labelToNode(label);

            const isClaimed = await this.publicClient.readContract({
                address: this.config.contractAddress,
                abi: L1SubnameRegistrarContractABI,
                functionName: 'nameTaken',
                args: [node],
            });

            return isClaimed as boolean;
        } catch (error) {
            console.error('Error checking subname claim status:', error);
            throw new Error(
                `Failed to check subname claim status: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get the owner of a subname
     */
    public async getSubnameOwner(label: string): Promise<Address> {
        try {
            const owner = await this.publicClient.readContract({
                address: this.config.contractAddress,
                abi: L1SubnameRegistrarContractABI,
                functionName: 'getSubnameOwner',
                args: [label],
            });

            return owner as Address;
        } catch (error) {
            console.error('Error getting subname owner:', error);
            throw new Error(
                `Failed to get subname owner: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get complete ownership information for a subname
     */
    public async getSubnameOwnershipInfo(
        label: string,
    ): Promise<SubnameOwnershipInfo> {
        try {
            const [owner, isClaimed] = await Promise.all([
                this.getSubnameOwner(label),
                this.isSubnameClaimed(label),
            ]);

            return {
                owner,
                isClaimed,
                node: this.labelToNode(label),
            };
        } catch (error) {
            console.error('Error getting subname ownership info:', error);
            throw new Error(
                `Failed to get subname ownership info: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Claim a subname with raw transaction signing
     */
    public async claimSubnameWithPrivateKey(
        label: string,
        privateKey: `0x${string}`,
    ): Promise<SubnameClaimResult> {
        try {
            const account = privateKeyToAccount(privateKey);

            // Check if subname is already claimed
            const isClaimed = await this.isSubnameClaimed(label);
            if (isClaimed) {
                return {
                    success: false,
                    error: `Subname "${label}" is already claimed`,
                };
            }

            // Get current nonce
            const nonce = await this.publicClient.getTransactionCount({
                address: account.address,
                blockTag: 'pending',
            });

            // Encode function data
            const data = encodeFunctionData({
                abi: L1SubnameRegistrarContractABI,
                functionName: 'claimName',
                args: [label],
            });

            // Get gas estimate
            const gasEstimate = await this.publicClient.estimateGas({
                account: account.address,
                to: this.config.contractAddress,
                data,
            });

            // Get current gas price
            const gasPrice = await this.publicClient.getGasPrice();

            // Build transaction
            const transaction = {
                to: this.config.contractAddress,
                data,
                gas: gasEstimate,
                gasPrice,
                nonce,
                chainId: this.config.chain.id,
            };

            // Sign transaction
            const signedTransaction =
                await account.signTransaction(transaction);

            // Send raw transaction
            const hash = await this.publicClient.sendRawTransaction({
                serializedTransaction: signedTransaction,
            });

            // Wait for transaction receipt
            const receipt = await this.publicClient.waitForTransactionReceipt({
                hash,
            });

            if (receipt.status === 'success') {
                const node = this.labelToNode(label);
                return {
                    success: true,
                    node,
                    transactionHash: hash,
                };
            } else {
                return {
                    success: false,
                    error: 'Transaction failed',
                };
            }
        } catch (error) {
            console.error('Error claiming subname with private key:', error);

            // Handle specific contract errors
            if (error instanceof Error) {
                if (error.message.includes('NameAlreadyClaimed')) {
                    return {
                        success: false,
                        error: `Subname "${label}" is already claimed`,
                    };
                }
                if (error.message.includes('OwnableUnauthorizedAccount')) {
                    return {
                        success: false,
                        error: 'Unauthorized to claim subname',
                    };
                }
                if (error.message.includes('insufficient funds')) {
                    return {
                        success: false,
                        error: 'Insufficient funds for transaction',
                    };
                }
            }

            return {
                success: false,
                error: `Failed to claim subname: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            };
        }
    }

    /**
     * Get all registered subnames
     */
    public async getAllSubnames(): Promise<string[]> {
        try {
            const subnameNodes = await this.publicClient.readContract({
                address: this.config.contractAddress,
                abi: L1SubnameRegistrarContractABI,
                functionName: 'viewAllSubnames',
            });

            return (subnameNodes as `0x${string}`[]).map((node) =>
                this.nodeToLabel(node),
            );
        } catch (error) {
            console.error('Error getting all subnames:', error);
            throw new Error(
                `Failed to get all subnames: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get contract owner
     */
    public async getContractOwner(): Promise<Address> {
        try {
            const owner = await this.publicClient.readContract({
                address: this.config.contractAddress,
                abi: L1SubnameRegistrarContractABI,
                functionName: 'owner',
            });

            return owner as Address;
        } catch (error) {
            console.error('Error getting contract owner:', error);
            throw new Error(
                `Failed to get contract owner: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get parent node
     */
    public async getParentNode(): Promise<`0x${string}`> {
        try {
            const parentNode = await this.publicClient.readContract({
                address: this.config.contractAddress,
                abi: L1SubnameRegistrarContractABI,
                functionName: 'parentNode',
            });

            return parentNode as `0x${string}`;
        } catch (error) {
            console.error('Error getting parent node:', error);
            throw new Error(
                `Failed to get parent node: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get SubnameClaimed events for a specific owner
     */
    public async getSubnameClaimedEvents(
        owner?: Address,
    ): Promise<SubnameClaimedEvent[]> {
        try {
            const events = await this.publicClient.getContractEvents({
                address: this.config.contractAddress,
                abi: L1SubnameRegistrarContractABI,
                eventName: 'SubnameClaimed',
                args: owner ? { owner } : undefined,
                fromBlock: 'earliest',
                toBlock: 'latest',
            });

            return events.map((event) => ({
                node: event.args.node as `0x${string}`,
                label: event.args.label as string,
                owner: event.args.owner as Address,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
            }));
        } catch (error) {
            console.error('Error getting SubnameClaimed events:', error);
            throw new Error(
                `Failed to get SubnameClaimed events: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Check if user has claimed any subnames
     */
    public async hasUserClaimedSubname(userAddress: Address): Promise<boolean> {
        try {
            const events = await this.getSubnameClaimedEvents(userAddress);
            return events.length > 0;
        } catch (error) {
            console.error('Error checking user subname claims:', error);
            throw new Error(
                `Failed to check user subname claims: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get all subnames claimed by a specific user
     */
    public async getUserSubnames(userAddress: Address): Promise<string[]> {
        try {
            const events = await this.getSubnameClaimedEvents(userAddress);
            return events.map((event) => event.label);
        } catch (error) {
            console.error('Error getting user subnames:', error);
            throw new Error(
                `Failed to get user subnames: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Verify service connection
     */
    public async verifyConnection(): Promise<boolean> {
        try {
            // Try to read a simple contract function
            await this.getContractOwner();
            console.log('ENS Subname Service connection verified');
            return true;
        } catch (error) {
            console.error('ENS Subname Service connection failed:', error);
            return false;
        }
    }

    /**
     * Set wallet client (useful for dynamic wallet connection)
     */
    public setWalletClient(walletClient: WalletClient): void {
        this.walletClient = walletClient;
    }

    /**
     * Convert label to node (bytes32)
     */
    private labelToNode(label: string): `0x${string}` {
        // Simple conversion for demonstration
        // In production, you should use proper ENS name hashing
        const hexString = Buffer.from(label).toString('hex').padEnd(64, '0');
        return `0x${hexString}` as `0x${string}`;
    }

    /**
     * Convert node to label
     */
    private nodeToLabel(node: `0x${string}`): string {
        // Simple conversion for demonstration
        // In production, you should use proper ENS name decoding
        const hex = node.startsWith('0x') ? node.slice(2) : node;
        const cleanHex = hex.replace(/0+$/, '');
        if (cleanHex.length === 0) return '';
        return Buffer.from(cleanHex, 'hex').toString();
    }
}

export default ENSSubnameService;

// Utility functions for common configurations
export const createMainnetENSSubnameService = (
    contractAddress: Address,
    parentNode: `0x${string}`,
    rpcUrl: string,
    walletClient?: WalletClient,
): ENSSubnameService => {
    return new ENSSubnameService(
        {
            chain: mainnet,
            rpcUrl,
            contractAddress,
            parentNode,
        },
        walletClient,
    );
};

export const createSepoliaENSSubnameService = (
    contractAddress: Address,
    parentNode: `0x${string}`,
    rpcUrl: string,
    walletClient?: WalletClient,
): ENSSubnameService => {
    return new ENSSubnameService(
        {
            chain: sepolia,
            rpcUrl,
            contractAddress,
            parentNode,
        },
        walletClient,
    );
};

// Helper function to create custom chain service
export const createCustomENSSubnameService = (
    chain: Chain,
    contractAddress: Address,
    parentNode: `0x${string}`,
    rpcUrl: string,
    walletClient?: WalletClient,
): ENSSubnameService => {
    return new ENSSubnameService(
        {
            chain,
            rpcUrl,
            contractAddress,
            parentNode,
        },
        walletClient,
    );
};
