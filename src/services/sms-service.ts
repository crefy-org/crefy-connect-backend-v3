// src/services/sms-service.ts
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Types
export interface SmsSendOptions {
    phoneNumber: string;
    message: string;
    maxRetries?: number;
    retryDelay?: number;
}

export interface SmsResponse {
    success: boolean;
    messageId?: string;
    status?: string;
    error?: string;
    details?: any;
}

export interface SmsServiceConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
}

class SmsService {
    private apiKey: string;
    private baseUrl: string;
    private http: AxiosInstance;
    private maxRetries: number;
    private retryDelay: number;

    /**
     * Enhanced SMS Service constructor
     * @param config - Configuration object for the SMS service
     */
    constructor(config: SmsServiceConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl =
            config.baseUrl ||
            'https://kbzktzsczpwsttjmfnge.supabase.co/functions/v1/send-message';
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 1000; // 1 second

        this.http = axios.create({
            baseURL: this.baseUrl,
            timeout: config.timeout || 10000, // 10 seconds default
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'User-Agent': 'CrefyConnect-SMS-Service/1.0.0',
            },
        });

        // Add response interceptor for better error handling
        this.http.interceptors.response.use(
            this.handleResponse.bind(this),
            this.handleError.bind(this),
        );
    }

    /**
     * Send SMS to a phone number with retry logic
     * @param options - SMS sending options
     */
    async sendSms(options: SmsSendOptions): Promise<SmsResponse> {
        const {
            phoneNumber,
            message,
            maxRetries = this.maxRetries,
            retryDelay = this.retryDelay,
        } = options;

        // Validate phone number
        const validatedPhoneNumber = this.validatePhoneNumber(phoneNumber);
        if (!validatedPhoneNumber) {
            return {
                success: false,
                error: 'INVALID_PHONE_NUMBER',
                details: 'Phone number must be in international format',
            };
        }

        // Validate message
        if (!this.validateMessage(message)) {
            return {
                success: false,
                error: 'INVALID_MESSAGE',
                details:
                    'Message cannot be empty and must be less than 1600 characters',
            };
        }

        // Send with retry logic
        return this.sendWithRetry(
            {
                phoneNumber: validatedPhoneNumber,
                message: this.truncateMessage(message),
            },
            maxRetries,
            retryDelay,
        );
    }

    /**
     * Send OTP message with standardized format
     * @param phoneNumber - Recipient phone number
     * @param otp - The OTP code
     * @param expiryMinutes - OTP expiry time in minutes
     */
    async sendOTP(
        phoneNumber: string,
        otp: string,
        expiryMinutes: number = 10,
    ): Promise<SmsResponse> {
        const message = `Your Crefy Connect verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes.`;

        return this.sendSms({
            phoneNumber,
            message,
            maxRetries: 2, // Fewer retries for OTP for faster failure
        });
    }

    /**
     * Send welcome message
     * @param phoneNumber - Recipient phone number
     */
    async sendWelcomeMessage(phoneNumber: string): Promise<SmsResponse> {
        const message = `Welcome to Crefy Connect! Your wallet has been successfully created and is ready to use.`;

        return this.sendSms({
            phoneNumber,
            message,
        });
    }

    /**
     * Send transaction notification
     * @param phoneNumber - Recipient phone number
     * @param amount - Transaction amount
     * @param type - Transaction type (sent/received)
     */
    async sendTransactionNotification(
        phoneNumber: string,
        amount: string,
        type: 'sent' | 'received',
    ): Promise<SmsResponse> {
        const action = type === 'sent' ? 'sent' : 'received';
        const message = `You've ${action} ${amount} from your Crefy Connect wallet.`;

        return this.sendSms({
            phoneNumber,
            message,
        });
    }

    /**
     * Private method to send with retry logic
     */
    private async sendWithRetry(
        data: { phoneNumber: string; message: string },
        maxRetries: number,
        retryDelay: number,
        attempt: number = 1,
    ): Promise<SmsResponse> {
        try {
            console.log(
                `📱 Attempting to send SMS (attempt ${attempt}/${maxRetries}) to: ${data.phoneNumber}`,
            );

            const response: AxiosResponse = await this.http.post('', data);

            console.log(`✅ SMS sent successfully to: ${data.phoneNumber}`);
            return {
                success: true,
                messageId: response.data.messageId || response.data.id,
                status: response.data.status || 'sent',
                details: response.data,
            };
        } catch (error: any) {
            console.error(
                `❌ SMS send failed (attempt ${attempt}/${maxRetries}):`,
                error.message,
            );

            // Check if we should retry
            if (attempt < maxRetries && this.shouldRetry(error)) {
                console.log(`🔄 Retrying SMS in ${retryDelay}ms...`);
                await this.delay(retryDelay * attempt); // Exponential backoff
                return this.sendWithRetry(
                    data,
                    maxRetries,
                    retryDelay,
                    attempt + 1,
                );
            }

            return {
                success: false,
                error: this.getErrorCode(error),
                details: this.getErrorDetails(error),
            };
        }
    }

    /**
     * Handle successful responses
     */
    private handleResponse(response: AxiosResponse): AxiosResponse {
        // You can add response transformation here if needed
        return response;
    }

    /**
     * Handle errors globally
     */
    private handleError(error: AxiosError): Promise<never> {
        // Convert Axios error to more readable format
        const enhancedError = new Error(this.getErrorMessage(error));
        (enhancedError as any).code = this.getErrorCode(error);
        (enhancedError as any).status = error.response?.status;
        (enhancedError as any).details = this.getErrorDetails(error);

        return Promise.reject(enhancedError);
    }

    /**
     * Determine if we should retry based on error type
     */
    private shouldRetry(error: any): boolean {
        const retryableCodes = [
            'NETWORK_ERROR',
            'TIMEOUT_ERROR',
            'SERVER_ERROR',
            'RATE_LIMITED',
        ];

        return (
            retryableCodes.includes(error.code) ||
            error.response?.status >= 500 || // Server errors
            error.code === 'ECONNABORTED'
        ); // Timeout
    }

    /**
     * Get error code from Axios error
     */
    private getErrorCode(error: AxiosError): string {
        if (error.code === 'ECONNABORTED') return 'TIMEOUT_ERROR';
        if (error.code === 'ENOTFOUND') return 'NETWORK_ERROR';
        if (error.response?.status === 429) return 'RATE_LIMITED';
        if (error.response?.status == 500) return 'SERVER_ERROR';
        if (error.response?.status == 400) return 'CLIENT_ERROR';

        return 'UNKNOWN_ERROR';
    }

    /**
     * Get user-friendly error message
     */
    private getErrorMessage(error: AxiosError): string {
        const code = this.getErrorCode(error);

        const messages: { [key: string]: string } = {
            NETWORK_ERROR: 'Network connection failed',
            TIMEOUT_ERROR: 'Request timed out',
            RATE_LIMITED: 'Too many requests, please try again later',
            SERVER_ERROR: 'SMS service is temporarily unavailable',
            CLIENT_ERROR: 'Invalid request to SMS service',
            UNKNOWN_ERROR: 'Failed to send SMS',
        };

        return messages[code] || `SMS sending failed: ${error.message}`;
    }

    /**
     * Get error details for debugging
     */
    private getErrorDetails(error: AxiosError): any {
        return {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method,
        };
    }

    /**
     * Validate and format phone number
     */
    private validatePhoneNumber(phoneNumber: string): string | null {
        // Remove any non-digit characters except +
        const cleaned = phoneNumber.replace(/[^\d+]/g, '');

        // Basic validation for international format
        // Should start with + followed by country code
        if (!cleaned.startsWith('+')) {
            return `+${cleaned}`;
        }

        // Check if it has at least 10 digits (including country code)
        const digitsOnly = cleaned.replace('+', '');
        if (digitsOnly.length < 10) {
            return null;
        }

        return cleaned;
    }

    /**
     * Validate message content - FIXED VERSION
     */
    private validateMessage(message: string): boolean {
        return !!message && message.trim().length > 0 && message.length <= 1600;
    }

    /**
     * Truncate message if too long
     */
    private truncateMessage(message: string, maxLength: number = 1600): string {
        if (message.length <= maxLength) {
            return message;
        }

        console.warn(
            `Message truncated from ${message.length} to ${maxLength} characters`,
        );
        return message.substring(0, maxLength - 3) + '...';
    }

    /**
     * Utility function for delays
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Get service status (health check)
     */
    async getStatus(): Promise<{ healthy: boolean; latency?: number }> {
        const startTime = Date.now();

        try {
            // You might want to create a simple health check endpoint
            await this.http.get('');
            const latency = Date.now() - startTime;

            return {
                healthy: true,
                latency,
            };
        } catch (error) {
            return {
                healthy: false,
            };
        }
    }
}

// Create and export a singleton instance
export const createSmsService = (config: SmsServiceConfig): SmsService => {
    return new SmsService(config);
};

export default SmsService;
