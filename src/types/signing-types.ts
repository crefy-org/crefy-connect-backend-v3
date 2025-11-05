// src/types/signing-types.ts
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsArray,
    IsObject,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Simple DTO classes for TSOA compatibility
export class TypedDataDomain {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    version?: string;

    @IsOptional()
    @IsNumber()
    chainId?: number;

    @IsOptional()
    @IsString()
    verifyingContract?: string;

    @IsOptional()
    @IsString()
    salt?: string;
}

export class TypedDataField {
    @IsString()
    name!: string;

    @IsString()
    type!: string;
}

export class TypedDataType {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TypedDataField)
    fields!: TypedDataField[];
}

export class SignMessageRequest {
    @IsNumber()
    chainId!: number;

    @IsString()
    message!: string;
}

export class SignTransactionRequest {
    @IsNumber()
    chainId!: number;

    @IsString()
    to!: string;

    @IsString()
    value!: string;

    @IsOptional()
    @IsString()
    data?: string;

    @IsString()
    gasLimit!: string;

    @IsOptional()
    @IsString()
    gasPrice?: string;

    @IsOptional()
    @IsString()
    maxFeePerGas?: string;

    @IsOptional()
    @IsString()
    maxPriorityFeePerGas?: string;

    @IsOptional()
    @IsNumber()
    nonce?: number;
}

export class SignTypedDataRequest {
    @IsNumber()
    chainId!: number;

    @ValidateNested()
    @Type(() => TypedDataDomain)
    domain!: TypedDataDomain;

    @IsObject()
    types!: Record<string, TypedDataField[]>;

    @IsString()
    primaryType!: string;

    @IsObject()
    message!: Record<string, any>;
}

export class SigningResponse {
    @IsBoolean()
    success!: boolean;

    @IsOptional()
    @IsString()
    signature?: string;

    @IsOptional()
    @IsString()
    signedTransaction?: string;

    @IsOptional()
    @IsString()
    error?: string;

    @IsOptional()
    @IsNumber()
    chainId?: number;

    @IsOptional()
    @IsString()
    chainName?: string;
}

export interface ChainConfig {
    chain: any;
    rpcUrl: string;
    explorerUrl: string;
    currency: string;
    testnet: boolean;
}
