import {
    english,
    generateMnemonic,
    mnemonicToAccount,
    privateKeyToAccount,
} from 'viem/accounts';
import { toHex } from 'viem/utils';

/**
 * Custom error class for wallet generation failures
 */
export class WalletServiceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WalletServiceError';
    }
}

/**
 * Interface for wallet information
 */
export interface WalletInfo {
    address: string;
    privateKey: string;
    mnemonic: string;
    publicKey: string;
}

/**
 * Service for generating cryptocurrency wallets
 */
class WalletService {
    private readonly mnemonicStrength: number = 128;

    /**
     * Generates a new cryptocurrency wallet with mnemonic phrase
     * @returns Promise resolving to WalletInfo object
     * @throws {WalletServiceError} When wallet generation fails
     */
    public async generateWallet(): Promise<WalletInfo> {
        try {
            const mnemonic = this.generateMnemonic();
            const account = mnemonicToAccount(mnemonic);
            const privateKey = this.extractPrivateKey(account);

            this.validateWalletConsistency(account, privateKey);

            return {
                address: account.address,
                privateKey,
                mnemonic,
                publicKey: account.publicKey,
            };
        } catch (error) {
            throw this.handleGenerationError(error);
        }
    }

    /**
     * Generates a new mnemonic phrase
     * @returns 12-word mnemonic phrase
     */
    private generateMnemonic(): string {
        return generateMnemonic(english, this.mnemonicStrength);
    }

    /**
     * Extracts private key from account
     * @param account - The account generated from mnemonic
     * @returns Hexadecimal private key string
     */
    private extractPrivateKey(account: any): string {
        const privateKey = account.getHdKey().privateKey;
        if (!privateKey) {
            throw new WalletServiceError(
                'Failed to extract private key from mnemonic',
            );
        }
        return toHex(privateKey);
    }

    /**
     * Validates that the address derived from mnemonic matches the address from private key
     * @param mnemonicAccount - Account generated from mnemonic
     * @param privateKey - Private key extracted from mnemonic
     * @throws {WalletServiceError} When addresses don't match
     */
    private validateWalletConsistency(
        mnemonicAccount: any,
        privateKey: string,
    ): void {
        const privateKeyAccount = privateKeyToAccount(
            privateKey as `0x${string}`,
        );

        if (
            mnemonicAccount.address.toLowerCase() !==
            privateKeyAccount.address.toLowerCase()
        ) {
            throw new WalletServiceError(
                'Address mismatch between mnemonic and private key derivation',
            );
        }
    }

    /**
     * Handles and transforms generation errors
     * @param error - The caught error
     * @returns Formatted WalletServiceError
     */
    private handleGenerationError(error: unknown): WalletServiceError {
        console.error('Wallet generation failed:', error);

        if (error instanceof WalletServiceError) {
            return error;
        }

        const message =
            error instanceof Error
                ? error.message
                : 'Unknown error occurred during wallet generation';

        return new WalletServiceError(message);
    }

    /**
     * Generates multiple wallets in batch
     * @param count - Number of wallets to generate
     * @returns Array of WalletInfo objects
     */
    public async generateMultipleWallets(count: number): Promise<WalletInfo[]> {
        if (count <= 0) {
            throw new WalletServiceError('Count must be greater than 0');
        }

        if (count > 100) {
            throw new WalletServiceError(
                'Cannot generate more than 100 wallets at once',
            );
        }

        const wallets: WalletInfo[] = [];

        for (let i = 0; i < count; i++) {
            try {
                const wallet = await this.generateWallet();
                wallets.push(wallet);
            } catch (error) {
                console.error(`Failed to generate wallet ${i + 1}:`, error);
                throw new WalletServiceError(
                    `Failed to generate wallet ${i + 1}`,
                );
            }
        }

        return wallets;
    }

    /**
     * Validates a mnemonic phrase
     * @param mnemonic - The mnemonic phrase to validate
     * @returns boolean indicating if mnemonic is valid
     */
    public validateMnemonic(mnemonic: string): boolean {
        try {
            mnemonicToAccount(mnemonic);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Recovers wallet from mnemonic phrase
     * @param mnemonic - The mnemonic phrase
     * @returns WalletInfo object
     */
    public recoverWalletFromMnemonic(mnemonic: string): WalletInfo {
        try {
            const account = mnemonicToAccount(mnemonic);
            const privateKey = this.extractPrivateKey(account);

            return {
                address: account.address,
                privateKey,
                mnemonic,
                publicKey: account.publicKey,
            };
        } catch (error) {
            throw new WalletServiceError('Invalid mnemonic phrase');
        }
    }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;
