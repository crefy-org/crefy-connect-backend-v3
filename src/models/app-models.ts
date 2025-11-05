import { Document, Schema, model, Model, Types } from 'mongoose';
import { generateAppId, generateClientSecret } from '../utils/auth';

export interface IApp extends Document {
    developerId: Types.ObjectId;
    name: string;
    appId: string;
    description?: string;
    redirectUrls: string[];
    iconUrl?: string;
    clientSecret: string;
    createdAt: Date;
    updatedAt: Date;
}

const AppSchema = new Schema<IApp>(
    {
        developerId: {
            type: Schema.Types.ObjectId,
            ref: 'Developer',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        appId: {
            type: String,
            required: true,
            unique: true, // This creates the index automatically
            default: generateAppId,
            validate: {
                validator: (v: string) => /^[a-f0-9]{64}$/.test(v),
                message: 'App ID must be a 64-character hex string',
            },
        },
        description: {
            type: String,
            required: false,
            trim: true,
            maxlength: 500,
        },
        redirectUrls: [
            {
                type: String,
                required: true,
                validate: {
                    validator: function (url: string) {
                        try {
                            new URL(url);
                            return (
                                url.startsWith('https://') ||
                                url.startsWith('http://')
                            );
                        } catch {
                            return false;
                        }
                    },
                    message: 'Redirect URL must be a valid HTTP/HTTPS URL',
                },
            },
        ],
        iconUrl: {
            type: String,
            required: false,
            trim: true,
            validate: {
                validator: function (v: string) {
                    if (!v) return true; // Optional field
                    try {
                        new URL(v);
                        return (
                            v.startsWith('https://') || v.startsWith('http://')
                        );
                    } catch {
                        return false;
                    }
                },
                message: 'Icon URL must be a valid HTTP/HTTPS URL',
            },
        },
        clientSecret: {
            type: String,
            required: true,
            select: false,
            default: generateClientSecret,
        },
    },
    {
        timestamps: true,
    },
);

// Indexes - REMOVE the duplicate appId index
AppSchema.index({ developerId: 1 });
AppSchema.index({ createdAt: -1 });

// Validation for at least one redirect URL
AppSchema.pre<IApp>('save', function (next) {
    if (this.redirectUrls.length === 0) {
        return next(new Error('At least one redirect URL is required'));
    }

    // Remove duplicate redirect URLs
    this.redirectUrls = [...new Set(this.redirectUrls)];

    next();
});

// Static methods
AppSchema.statics.findByAppId = function (appId: string) {
    return this.findOne({ appId });
};

AppSchema.statics.findByDeveloper = function (developerId: Types.ObjectId) {
    return this.find({ developerId }).sort({ createdAt: -1 });
};

// Instance method to verify client secret
AppSchema.methods.verifyClientSecret = function (secret: string): boolean {
    return this.clientSecret === secret;
};

export const App: Model<IApp> = model<IApp>('App', AppSchema);
