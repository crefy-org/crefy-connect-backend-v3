import dotenv from 'dotenv';
import { MongoDBConfig, JWTConfig, SMTPConfig } from './types';

dotenv.config();

export const mongodb_config: MongoDBConfig = {
    port: parseInt(process.env.MONGODB_PORT || '3000'),
    mongoUri:
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/crefy-crefy-connect',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '1h',
    jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    poolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10'),
    retryWrites: process.env.MONGODB_RETRY_WRITES === 'true',
    w: process.env.MONGODB_WRITE_CONCERN === 'majority' ? 'majority' : 1,
};

export const jwt_config: JWTConfig = {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
};

export const smtp_config: SMTPConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USERNAME || '',
        pass: process.env.SMTP_PASSWORD || '',
    },
    from:
        process.env.EMAIL_FROM_NAME ||
        '"Crefy Connect" <noreply@crefyconnect.com>',
};
