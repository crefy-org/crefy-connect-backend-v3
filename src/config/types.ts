export interface MongoDBConfig {
    port: number;
    mongoUri: string;
    jwtSecret: string;
    jwtExpiration: string;
    jwtRefreshExpiration: string;
    poolSize?: number;
    retryWrites?: boolean;
    w?: 'majority' | number;
}

export interface JWTConfig {
    secret: string;
    expiresIn: string;
}

export interface SMTPConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}
