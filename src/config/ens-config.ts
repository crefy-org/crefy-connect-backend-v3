// src/config/ens-config.ts
export const ENS_CONFIG = {
    SEPOLIA: {
        RPC_URL:
            process.env.SEPOLIA_RPC_URL ||
            'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
        CONTRACT_ADDRESS: process.env
            .ENS_SUBNAME_CONTRACT_ADDRESS as `0x${string}`,
        PARENT_NODE: process.env.ENS_PARENT_NODE as `0x${string}`,
        CHAIN_ID: 11155111,
        BLOCK_EXPLORER: 'https://sepolia.etherscan.io',
        NETWORK_NAME: 'Sepolia',
    },
} as const;
