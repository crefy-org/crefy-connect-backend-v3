import { Document, Schema, model, Model, Types } from 'mongoose';

export interface IENSRoot extends Document {
    ensName: string; // Changed to camelCase
    contractAddress?: string | undefined;
    ownerAppId: string;
    status: 'pending' | 'active' | 'failed';
    txHash?: string | undefined;
    createdAt: Date;
    updatedAt: Date;
}

const ENSRootSchema = new Schema<IENSRoot>(
    {
        ensName: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: (v: string) => v.endsWith('.eth'),
                message: 'ENS name must end with .eth',
            },
        },
        contractAddress: {
            type: String,
            required: false,
            validate: {
                validator: function (v: string) {
                    if (!v) return true; // Optional field
                    return /^0x[a-fA-F0-9]{40}$/.test(v);
                },
                message: 'Invalid Ethereum address',
            },
        },
        ownerAppId: {
            type: String,
            required: true,
            ref: 'App',
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'failed'],
            default: 'pending',
            index: true,
        },
        txHash: {
            type: String,
            required: false,
            validate: {
                validator: function (v: string) {
                    if (!v) return true; // Optional field
                    return /^0x[a-fA-F0-9]{64}$/.test(v);
                },
                message: 'Invalid transaction hash',
            },
        },
    },
    {
        timestamps: true, // Automatically handles createdAt and updatedAt
    },
);

// Indexes for better query performance
ENSRootSchema.index({ ensName: 1 });
ENSRootSchema.index({ ownerAppId: 1, status: 1 });
ENSRootSchema.index({ createdAt: -1 });

// Validation for contractAddress when status is active
ENSRootSchema.pre<IENSRoot>('save', function (next) {
    if (this.status === 'active' && !this.contractAddress) {
        return next(
            new Error('Contract address is required when status is active'),
        );
    }

    // Ensure ENS name is lowercase for consistency
    if (this.ensName) {
        this.ensName = this.ensName.toLowerCase();
    }

    next();
});

// Static methods
ENSRootSchema.statics.findByAppId = function (ownerAppId: string) {
    return this.find({ ownerAppId }).sort({ createdAt: -1 });
};

ENSRootSchema.statics.findActiveByAppId = function (ownerAppId: string) {
    return this.findOne({ ownerAppId, status: 'active' });
};

ENSRootSchema.statics.findByENSName = function (ensName: string) {
    return this.findOne({ ensName: ensName.toLowerCase() });
};

// Instance method to update status
ENSRootSchema.methods.updateStatus = function (
    status: 'pending' | 'active' | 'failed',
    contractAddress?: string,
    txHash?: string,
) {
    this.status = status;
    if (contractAddress) this.contractAddress = contractAddress;
    if (txHash) this.txHash = txHash;
    return this.save();
};

export const ENSRoot: Model<IENSRoot> = model<IENSRoot>(
    'ENSRoot',
    ENSRootSchema,
);
