import { Document, Schema, model, Model } from 'mongoose';

export interface IOAuthTokens {
    accessToken?: string;
    refreshToken?: string;
}

export interface IWallet extends Document {
    appId: string;
    email?: string | undefined;
    phoneNumber?: string | undefined;
    subname?: string | undefined;
    socialType: string;
    address: string;
    publicKey: string;
    encryptedPrivateKey: string;
    encryptionSalt: string;
    userData?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    otp?: string;
    otpExpiry?: Date;
    oauthTokens?: IOAuthTokens;
}

const WalletSchema = new Schema<IWallet>(
    {
        appId: {
            type: String,
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: false,
            index: true,
            sparse: true,
        },
        phoneNumber: {
            type: String,
            required: false,
            index: true,
            sparse: true,
        },
        subname: {
            type: String,
            required: false,
        },
        socialType: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
            index: true,
        },
        publicKey: {
            type: String,
            required: true,
        },
        encryptedPrivateKey: {
            type: String,
            required: true,
        },
        encryptionSalt: {
            type: String,
            required: true,
        },
        userData: {
            type: String,
            required: false,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
            required: false,
        },
        otpExpiry: {
            type: Date,
            required: false,
        },
        oauthTokens: {
            accessToken: { type: String },
            refreshToken: { type: String },
        },
    },
    {
        timestamps: true, // Automatically handles createdAt and updatedAt
    },
);

// Compound indexes
WalletSchema.index({ appId: 1, address: 1 }, { unique: true });
WalletSchema.index(
    { appId: 1, email: 1 },
    {
        unique: true,
        sparse: true,
        partialFilterExpression: { email: { $type: 'string' } },
    },
);
WalletSchema.index(
    { appId: 1, phoneNumber: 1 },
    {
        unique: true,
        sparse: true,
        partialFilterExpression: { phoneNumber: { $type: 'string' } },
    },
);

// Validation for either email or phoneNumber
WalletSchema.pre<IWallet>('save', function (next) {
    if (!this.email && !this.phoneNumber) {
        return next(new Error('Either email or phoneNumber must be provided'));
    }

    // Clean up undefined fields
    if (!this.email) {
        this.email = undefined;
    }
    if (!this.phoneNumber) {
        this.phoneNumber = undefined;
    }

    next();
});

// Static method for finding by identifier (email or phone)
WalletSchema.statics.findByIdentifier = function (
    appId: string,
    identifier: string,
) {
    return this.findOne({
        appId,
        $or: [{ email: identifier }, { phoneNumber: identifier }],
    });
};

export const Wallet: Model<IWallet> = model<IWallet>('Wallet', WalletSchema);
