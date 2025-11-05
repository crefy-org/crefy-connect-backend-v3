# Crefy Connect Developer Platform API Design

## Overview

This document outlines the comprehensive API design for the Crefy Connect Developer Platform, focused on serving B2B developers with wallet authentication, ENS management, and signing services.

## Architecture Summary

The platform provides:

-   **Wallet Authentication**: Email/SMS-based wallet creation and authentication
-   **ENS Management**: Subname claiming and management on Sepolia
-   **Signing Services**: Message, transaction, and typed data signing
-   **Developer Tools**: Complete B2B developer platform with analytics and management

---

## 1. Developer Registration & Authentication APIs

### 1.1 Developer Registration

**POST** `/api/developers/register`

Register a new developer account with email verification.

**Request:**

```typescript
interface DeveloperRegistrationRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    website?: string;
    phoneNumber?: string;
    termsAccepted: boolean;
    marketingOptIn?: boolean;
}

interface DeveloperRegistrationResponse {
    success: boolean;
    message: string;
    data?: {
        developerId: string;
        email: string;
        verificationSent: boolean;
    };
}
```

**Response Examples:**

```json
{
    "success": true,
    "message": "Registration successful. Please verify your email.",
    "data": {
        "developerId": "64f7b2a1c3d4e5f6789abcde",
        "email": "developer@example.com",
        "verificationSent": true
    }
}
```

### 1.2 Developer Login

**POST** `/api/developers/login`

Authenticate developer and receive access tokens.

**Request:**

```typescript
interface DeveloperLoginRequest {
    email: string;
    password: string;
    deviceInfo?: {
        deviceType: 'web' | 'mobile' | 'desktop';
        browser: string;
        os: string;
        ip: string;
    };
}
```

**Response:**

```typescript
interface DeveloperLoginResponse {
    success: boolean;
    message: string;
    data?: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        developer: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            companyName?: string;
            emailVerified: boolean;
            twoFactorEnabled: boolean;
            subscription: {
                plan: string;
                status: 'active' | 'inactive' | 'trial';
                expiresAt: string;
            };
        };
    };
}
```

### 1.3 Developer Profile Management

**GET** `/api/developers/profile` (Authenticated)

Retrieve current developer profile information.

**PUT** `/api/developers/profile` (Authenticated)

Update developer profile information.

**Request:**

```typescript
interface DeveloperProfileUpdateRequest {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    website?: string;
    phoneNumber?: string;
    bio?: string;
    timezone?: string;
    preferences?: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        marketingEmails: boolean;
        weeklyReports: boolean;
    };
}
```

---

## 2. App Creation & Management APIs

### 2.1 Create Application

**POST** `/api/apps` (Authenticated)

Create a new application with wallet authentication capabilities.

**Request:**

```typescript
interface CreateAppRequest {
    name: string;
    description?: string;
    website: string;
    redirectUrls: string[];
    category: 'defi' | 'nft' | 'gaming' | 'social' | 'utilities' | 'other';
    logoUrl?: string;
    features: string[]; // ['email_auth', 'sms_auth', 'ens_support', 'signing']
    termsOfService?: string;
    privacyPolicy?: string;
    platform: 'web' | 'mobile' | 'both';
    targetAudience?: 'retail' | 'enterprise' | 'developers';
}
```

**Response:**

```typescript
interface CreateAppResponse {
    success: boolean;
    message: string;
    data?: {
        appId: string;
        name: string;
        clientSecret: string; // Only shown once
        webhookSecret: string; // For webhook verification
        redirectUrls: string[];
        features: string[];
        status: 'active' | 'pending_review' | 'suspended';
        createdAt: string;
        environment: 'sandbox' | 'production';
    };
}
```

### 2.2 Get Application Details

**GET** `/api/apps/{appId}` (Authenticated)

Retrieve detailed application information including usage statistics.

**Response:**

```typescript
interface AppDetailsResponse {
    success: boolean;
    data?: {
        appId: string;
        name: string;
        description?: string;
        website: string;
        logoUrl?: string;
        category: string;
        features: string[];
        redirectUrls: string[];
        status: 'active' | 'pending_review' | 'suspended';
        environment: 'sandbox' | 'production';
        createdAt: string;
        updatedAt: string;
        stats: {
            totalUsers: number;
            activeUsers24h: number;
            activeUsers7d: number;
            activeUsers30d: number;
            totalAuthentications: number;
            ensNamesClaimed: number;
            messagesSigned: number;
            transactionsSigned: number;
            lastActivityAt: string;
        };
        limits: {
            maxUsers: number;
            maxAuthenticationsPerDay: number;
            maxApiCallsPerDay: number;
            remainingAuthenticationsToday: number;
            remainingApiCallsToday: number;
        };
    };
}
```

### 2.3 Update Application

**PUT** `/api/apps/{appId}` (Authenticated)

Update application settings and configuration.

**Request:**

```typescript
interface UpdateAppRequest {
    name?: string;
    description?: string;
    website?: string;
    redirectUrls?: string[];
    logoUrl?: string;
    features?: string[];
    status?: 'active' | 'suspended';
}
```

### 2.4 List Applications

**GET** `/api/apps` (Authenticated)

List all applications for the authenticated developer with pagination.

**Query Parameters:**

-   `page`: number (default: 1)
-   `limit`: number (default: 10, max: 100)
-   `status`: 'active' | 'pending_review' | 'suspended' | 'all'
-   `category`: filter by category
-   `search`: search by name or description

**Response:**

```typescript
interface AppsListResponse {
    success: boolean;
    data?: {
        apps: Array<{
            appId: string;
            name: string;
            description?: string;
            category: string;
            status: string;
            environment: 'sandbox' | 'production';
            createdAt: string;
            stats: {
                totalUsers: number;
                activeUsers7d: number;
            };
        }>;
        pagination: {
            currentPage: number;
            totalPages: number;
            totalApps: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    };
}
```

### 2.5 Delete Application

**DELETE** `/api/apps/{appId}` (Authenticated)

Permanently delete an application and all associated data.

**Request:**

```typescript
interface DeleteAppRequest {
    confirmationText: string; // Must match app name for security
    reason?: string;
}
```

---

## 3. API Key & Access Control APIs

### 3.1 Generate API Keys

**POST** `/api/apps/{appId}/api-keys` (Authenticated)

Generate new API keys for different environments and permissions.

**Request:**

```typescript
interface GenerateApiKeyRequest {
    name: string;
    permissions: ('read' | 'write' | 'admin')[];
    environment: 'sandbox' | 'production';
    rateLimitPerHour?: number;
    ipRestrictions?: string[];
    expiresAt?: string;
    description?: string;
}
```

**Response:**

```typescript
interface GenerateApiKeyResponse {
    success: boolean;
    message: string;
    data?: {
        keyId: string;
        apiKey: string; // Only shown once
        name: string;
        permissions: string[];
        environment: string;
        rateLimitPerHour: number;
        expiresAt?: string;
        createdAt: string;
        lastUsedAt?: string;
    };
}
```

### 3.2 Manage API Keys

**GET** `/api/apps/{appId}/api-keys` (Authenticated)

List all API keys for an application.

**PUT** `/api/apps/{appId}/api-keys/{keyId}` (Authenticated)

Update API key settings.

**DELETE** `/api/apps/{appId}/api-keys/{keyId}` (Authenticated)

Revoke an API key.

---

## 4. Developer Dashboard & Analytics APIs

### 4.1 Get Dashboard Overview

**GET** `/api/analytics/dashboard` (Authenticated)

Retrieve comprehensive dashboard data for all applications.

**Response:**

```typescript
interface DashboardOverviewResponse {
    success: boolean;
    data?: {
        overview: {
            totalApps: number;
            activeApps: number;
            totalUsers: number;
            newUsers24h: number;
            activeUsers24h: number;
            totalAuthentications: number;
            successfulAuthentications24h: number;
            failedAuthentications24h: number;
            ensNamesClaimed: number;
            messagesSigned: number;
            transactionsSigned: number;
        };
        revenue: {
            currentMonthRevenue: number;
            projectedMonthlyRevenue: number;
            averageRevenuePerUser: number;
            churnRate: number;
            growthRate30d: number;
        };
        apps: Array<{
            appId: string;
            name: string;
            totalUsers: number;
            activeUsers24h: number;
            authenticationRate: number;
            errorRate: number;
            lastActivityAt: string;
        }>;
        trends: {
            userGrowth: Array<{ date: string; count: number }>;
            authenticationTrends: Array<{
                date: string;
                successful: number;
                failed: number;
            }>;
            revenueTrends: Array<{ date: string; revenue: number }>;
        };
        alerts: Array<{
            type: 'error' | 'warning' | 'info';
            message: string;
            appId?: string;
            timestamp: string;
        }>;
    };
}
```

### 4.2 Get Application Analytics

**GET** `/api/analytics/apps/{appId}` (Authenticated)

Retrieve detailed analytics for a specific application.

**Query Parameters:**

-   `period`: '1h' | '24h' | '7d' | '30d' | '90d'
-   `granularity`: 'hour' | 'day' | 'week'
-   `metrics`: comma-separated list of metrics to include

**Response:**

```typescript
interface AppAnalyticsResponse {
    success: boolean;
    data?: {
        appId: string;
        period: string;
        metrics: {
            users: {
                total: number;
                new: number;
                active: number;
                returning: number;
            };
            authentications: {
                total: number;
                successful: number;
                failed: number;
                byMethod: {
                    email: number;
                    sms: number;
                    ens: number;
                };
            };
            ens: {
                namesClaimed: number;
                uniqueClaimers: number;
                popularNames: Array<{ name: string; count: number }>;
            };
            signing: {
                messages: number;
                transactions: number;
                typedData: number;
                byChain: Record<string, number>;
            };
            performance: {
                averageResponseTime: number;
                errorRate: number;
                uptime: number;
            };
        };
        timeSeriesData: Array<{
            timestamp: string;
            users: number;
            authentications: number;
            ensClaims: number;
            signatures: number;
            errors: number;
        }>;
        funnels: {
            loginStarted: number;
            otpSent: number;
            otpVerified: number;
            walletCreated: number;
            conversionRate: number;
        };
        demographics: {
            countries: Record<string, number>;
            devices: Record<string, number>;
            browsers: Record<string, number>;
        };
    };
}
```

### 4.3 Export Analytics Data

**GET** `/api/analytics/export/{appId}` (Authenticated)

Export analytics data in various formats for external analysis.

**Query Parameters:**

-   `format`: 'csv' | 'json' | 'xlsx'
-   `period`: '7d' | '30d' | '90d' | 'custom'
-   `startDate`: ISO date string (for custom period)
-   `endDate`: ISO date string (for custom period)
-   `metrics`: specific metrics to include

**Response:**

```typescript
interface ExportResponse {
    success: boolean;
    data?: {
        downloadUrl: string;
        expiresAt: string;
        fileSize: number;
        recordCount: number;
    };
}
```

---

## 5. Billing & Subscription Management APIs

### 5.1 Get Subscription Plans

**GET** `/api/billing/plans`

Retrieve available subscription plans and their features.

**Response:**

```typescript
interface SubscriptionPlansResponse {
    success: boolean;
    data?: {
        plans: Array<{
            id: string;
            name: string;
            description: string;
            price: {
                monthly: number;
                yearly: number;
                currency: string;
            };
            features: {
                maxApps: number;
                maxUsers: number;
                maxApiCallsPerDay: number;
                emailAuth: boolean;
                smsAuth: boolean;
                ensSupport: boolean;
                webhooks: boolean;
                prioritySupport: boolean;
                customBranding: boolean;
                analytics: 'basic' | 'advanced' | 'enterprise';
            };
            limits: {
                authenticationsPerMonth: number;
                ensClaimsPerMonth: number;
                apiCallsPerDay: number;
            };
            popular?: boolean;
        }>;
        currentSubscription?: {
            planId: string;
            status: 'active' | 'inactive' | 'trial' | 'expired';
            billingCycle: 'monthly' | 'yearly';
            currentPeriodStart: string;
            currentPeriodEnd: string;
            cancelAtPeriodEnd: boolean;
        };
    };
}
```

### 5.2 Update Subscription

**POST** `/api/billing/subscription` (Authenticated)

Upgrade, downgrade, or modify subscription.

**Request:**

```typescript
interface UpdateSubscriptionRequest {
    action: 'upgrade' | 'downgrade' | 'change_billing_cycle';
    planId: string;
    billingCycle?: 'monthly' | 'yearly';
    paymentMethodId?: string;
    promoCode?: string;
}
```

### 5.3 Get Usage Statistics

**GET** `/api/billing/usage` (Authenticated)

Retrieve current billing period usage statistics.

**Response:**

```typescript
interface BillingUsageResponse {
    success: boolean;
    data?: {
        currentPeriod: {
            start: string;
            end: string;
        };
        usage: {
            authentications: {
                used: number;
                limit: number;
                remaining: number;
                percentage: number;
            };
            apiCalls: {
                used: number;
                limit: number;
                remaining: number;
                percentage: number;
            };
            ensClaims: {
                used: number;
                limit: number;
                remaining: number;
                percentage: number;
            };
            users: {
                total: number;
                limit: number;
                remaining: number;
                percentage: number;
            };
        };
        projections: {
            endOfPeriodUsage: number;
            overageCost: number;
            recommendedUpgrade: boolean;
        };
    };
}
```

### 5.4 Payment Methods Management

**GET** `/api/billing/payment-methods` (Authenticated)

List all payment methods for the developer account.

**POST** `/api/billing/payment-methods` (Authenticated)

Add a new payment method.

**DELETE** `/api/billing/payment-methods/{methodId}` (Authenticated)

Remove a payment method.

---

## 6. Webhook & Integration APIs

### 6.1 Webhook Management

**POST** `/api/apps/{appId}/webhooks` (Authenticated)

Create a new webhook endpoint.

**Request:**

```typescript
interface CreateWebhookRequest {
    url: string;
    events: string[]; // ['user.created', 'user.authenticated', 'ens.claimed', 'error.occurred']
    secret: string; // Used to verify webhook authenticity
    description?: string;
    isActive: boolean;
    retryPolicy: {
        maxRetries: number;
        backoffMultiplier: number;
        initialDelay: number;
    };
}
```

**Response:**

```typescript
interface CreateWebhookResponse {
    success: boolean;
    message: string;
    data?: {
        webhookId: string;
        url: string;
        secret: string; // Only shown once
        events: string[];
        status: 'active' | 'disabled';
        createdAt: string;
        stats: {
            totalDeliveries: number;
            successfulDeliveries: number;
            failedDeliveries: number;
            lastDeliveryAt?: string;
        };
    };
}
```

### 6.2 Webhook Event Types

**GET** `/api/webhooks/events`

Retrieve all available webhook event types and their schemas.

**Response:**

```typescript
interface WebhookEventsResponse {
    success: boolean;
    data?: {
        events: Array<{
            type: string;
            name: string;
            description: string;
            schema: object;
            example: object;
            category: 'user' | 'authentication' | 'ens' | 'signing' | 'system';
        }>;
    };
}
```

### 6.3 Webhook Delivery Logs

**GET** `/api/apps/{appId}/webhooks/{webhookId}/deliveries` (Authenticated)

Retrieve webhook delivery logs for debugging and monitoring.

**Query Parameters:**

-   `status`: 'success' | 'failed' | 'pending'
-   `eventType`: filter by event type
-   `startDate`: ISO date
-   `endDate`: ISO date
-   `page`: number
-   `limit`: number

### 6.4 Resend Webhook

**POST** `/api/apps/{appId}/webhooks/{webhookId}/deliveries/{deliveryId}/resend` (Authenticated)

Manually resend a failed webhook delivery.

---

## 7. App Security & Compliance APIs

### 7.1 Security Monitoring

**GET** `/api/security/dashboard` (Authenticated)

Retrieve security dashboard with threat monitoring and compliance status.

**Response:**

```typescript
interface SecurityDashboardResponse {
    success: boolean;
    data?: {
        threats: {
            suspiciousActivities: number;
            failedAttempts24h: number;
            blockedIPs: number;
            rateLimitViolations: number;
        };
        compliance: {
            gdprStatus: 'compliant' | 'non_compliant' | 'pending_review';
            soc2Status: 'compliant' | 'non_compliant' | 'pending_review';
            lastAuditDate?: string;
            nextAuditDate?: string;
        };
        security: {
            twoFactorEnabled: boolean;
            lastPasswordChange: string;
            activeSessions: number;
            apiKeyRotationRequired: boolean;
        };
        alerts: Array<{
            severity: 'low' | 'medium' | 'high' | 'critical';
            type: string;
            message: string;
            timestamp: string;
            resolved: boolean;
        }>;
    };
}
```

### 7.2 Access Control

**GET** `/api/security/access-logs` (Authenticated)

Retrieve access logs for security auditing.

**Query Parameters:**

-   `startDate`: ISO date
-   `endDate`: ISO date
-   `appId`: filter by specific app
-   `userId`: filter by specific user
-   `action`: filter by action type
-   `ipAddress`: filter by IP address
-   `page`: number
-   `limit`: number

### 7.3 Rate Limiting Management

**GET** `/api/security/rate-limits` (Authenticated)

Get current rate limiting configuration and usage.

**PUT** `/api/security/rate-limits` (Authenticated)

Update rate limiting settings.

**Request:**

```typescript
interface RateLimitConfigRequest {
    authenticationsPerMinute: number;
    apiCallsPerMinute: number;
    webhooksPerMinute: number;
    ipWhitelist?: string[];
    ipBlacklist?: string[];
    customLimits?: Array<{
        endpoint: string;
        limit: number;
        window: number; // in seconds
    }>;
}
```

---

## 8. Developer Onboarding & Documentation APIs

### 8.1 API Documentation

**GET** `/api/docs/openapi.json`

Retrieve OpenAPI 3.0 specification for the entire API.

**GET** `/api/docs/swagger-ui`

Serve interactive Swagger UI documentation.

**GET** `/api/docs/Postman.json`

Download Postman collection with all endpoints.

### 8.2 Code Examples & SDKs

**GET** `/api/sdk/languages`

Get available SDK languages and download links.

**Response:**

```typescript
interface AvailableSDKsResponse {
    success: boolean;
    data?: {
        sdks: Array<{
            language: string;
            version: string;
            downloadUrl: string;
            documentationUrl: string;
            examples: {
                basicAuth: string;
                walletLogin: string;
                ensClaim: string;
                messageSigning: string;
            };
        }>;
    };
}
```

### 8.3 Interactive API Tester

**POST** `/api/dev-tools/test-endpoint` (Authenticated)

Test API endpoints directly from the developer portal.

**Request:**

```typescript
interface TestEndpointRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    headers?: Record<string, string>;
    body?: any;
    authToken?: string;
}
```

**Response:**

```typescript
interface TestEndpointResponse {
    success: boolean;
    data?: {
        statusCode: number;
        headers: Record<string, string>;
        responseTime: number;
        body: any;
        curlCommand: string;
        javascriptCode: string;
        pythonCode: string;
    };
}
```

---

## 9. Error Handling & Response Standards

### 9.1 Standard Response Format

All API responses follow this standard format:

```typescript
interface APIResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        details: string;
        timestamp: string;
        requestId: string;
    };
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
```

### 9.2 Error Codes

**Authentication Errors:**

-   `UNAUTHORIZED`: Invalid or missing authentication token
-   `TOKEN_EXPIRED`: Authentication token has expired
-   `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

**Validation Errors:**

-   `VALIDATION_FAILED`: Request validation failed
-   `INVALID_INPUT`: Invalid input parameters
-   `MISSING_REQUIRED_FIELD`: Required field not provided

**Resource Errors:**

-   `RESOURCE_NOT_FOUND`: Requested resource not found
-   `RESOURCE_ALREADY_EXISTS`: Resource already exists
-   `RESOURCE_CONFLICT`: Resource conflict (e.g., duplicate data)

**Rate Limiting:**

-   `RATE_LIMIT_EXCEEDED`: Too many requests
-   `QUOTA_EXCEEDED`: Usage quota exceeded
-   `BILLING_REQUIRED`: Action requires billing setup

**System Errors:**

-   `INTERNAL_ERROR`: Internal server error
-   `SERVICE_UNAVAILABLE`: Service temporarily unavailable
-   `DATABASE_ERROR`: Database operation failed

---

## 10. Authentication & Authorization

### 10.1 Authentication Methods

**Bearer Token Authentication:**

```
Authorization: Bearer {access_token}
```

**API Key Authentication:**

```
X-API-Key: {api_key}
```

**Webhook Authentication:**

```
X-Webhook-Signature: {signature}
```

### 10.2 Permission Levels

**Developer Permissions:**

-   `developer.read`: Read own developer data
-   `developer.write`: Modify own developer data
-   `developer.admin`: Full developer account control

**App Permissions:**

-   `app.read`: Read app information
-   `app.write`: Modify app settings
-   `app.delete`: Delete apps
-   `app.admin`: Full app control

**Analytics Permissions:**

-   `analytics.read`: Read analytics data
-   `analytics.export`: Export analytics data

**Billing Permissions:**

-   `billing.read`: Read billing information
-   `billing.write`: Modify billing settings
-   `billing.admin`: Full billing control

---

## 11. Rate Limiting & Quotas

### 11.1 Rate Limits by Plan

| Plan       | API Calls/Hour | Auth/Hour | ENS Claims/Month |
| ---------- | -------------- | --------- | ---------------- |
| Free       | 100            | 50        | 10               |
| Basic      | 1,000          | 500       | 100              |
| Pro        | 10,000         | 5,000     | 1,000            |
| Enterprise | Unlimited      | Unlimited | Unlimited        |

### 11.2 Rate Limit Headers

All responses include rate limiting information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

---

## 12. Monitoring & Health Checks

### 12.1 Health Check Endpoint

**GET** `/api/health`

Simple health check for monitoring systems.

**Response:**

```typescript
{
    "status": "healthy",
    "timestamp": "2025-11-05T00:14:00.000Z",
    "version": "1.0.0",
    "uptime": 123456,
    "services": {
        "database": "healthy",
        "redis": "healthy",
        "email": "healthy",
        "sms": "healthy",
        "blockchain": "healthy"
    }
}
```

### 12.2 Detailed Status Endpoint

**GET** `/api/status`

Detailed system status including metrics and performance data.

**Response:**

```typescript
{
    "status": "operational",
    "timestamp": "2025-11-05T00:14:00.000Z",
    "services": {
        "authentication": {
            "status": "operational",
            "responseTime": 45,
            "successRate": 99.9
        },
        "ens": {
            "status": "operational",
            "responseTime": 120,
            "successRate": 98.5
        },
        "signing": {
            "status": "operational",
            "responseTime": 30,
            "successRate": 99.8
        }
    },
    "metrics": {
        "requestsPerSecond": 125,
        "averageResponseTime": 52,
        "errorRate": 0.01,
        "activeConnections": 450
    }
}
```

---

## Implementation Priority

### Phase 1: Core Platform (Weeks 1-4)

1. Developer Registration & Authentication
2. Basic App Creation & Management
3. API Key Management
4. Core Analytics Dashboard

### Phase 2: Advanced Features (Weeks 5-8)

1. Billing & Subscription Management
2. Webhook System
3. Security Monitoring
4. Export & Integration Tools

### Phase 3: Enterprise Features (Weeks 9-12)

1. Advanced Analytics
2. Compliance & Auditing
3. Custom Rate Limiting
4. Enterprise Support Tools

This comprehensive API design provides a robust foundation for B2B developers while maintaining security, scalability, and excellent developer experience.
