// src/services/email-service.ts
import nodemailer from 'nodemailer';

// Configuration interface
interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}

interface EmailAttachment {
    filename?: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
    encoding?: string;
}

// Email options interface
interface EmailOptions {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    attachments?: EmailAttachment[];
}

// Template data interfaces
interface OTPTemplateData {
    name: string;
    otp: string;
    expiryMinutes?: number;
}

interface PasswordResetTemplateData {
    name: string;
    resetLink: string;
    expiryMinutes?: number;
}

interface AccountActionTemplateData {
    name: string;
    action: string;
    reason?: string;
}

interface WelcomeTemplateData {
    name: string;
    loginLink?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;
    private config: EmailConfig;

    constructor(config: EmailConfig) {
        this.config = config;
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.auth.user,
                pass: config.auth.pass,
            },
        } as nodemailer.TransportOptions);
    }

    /**
     * Send a generic email
     */
    public async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            const mailOptions: nodemailer.SendMailOptions = {
                from: this.config.from,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                cc: options.cc,
                bcc: options.bcc,
                replyTo: options.replyTo,
                attachments: options.attachments,
            };

            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    /**
     * Send OTP email
     */
    public async sendOTP(
        email: string,
        data: OTPTemplateData,
        appName: string = 'Crefy Connect',
    ): Promise<boolean> {
        const expiryText = data.expiryMinutes
            ? `This OTP will expire in ${data.expiryMinutes} minutes.`
            : 'This OTP will expire shortly.';

        return this.sendEmail({
            to: email,
            subject: `Your ${appName} Verification Code`,
            text: `Hello ${data.name},\n\nYour verification code is: ${data.otp}\n\n${expiryText}\n\nIf you didn't request this code, please ignore this email.`,
            html: this.generateOTPHTML(data, appName),
        });
    }

    /**
     * Send password reset email
     */
    public async sendPasswordReset(
        email: string,
        data: PasswordResetTemplateData,
        appName: string = 'Crefy Connect',
    ): Promise<boolean> {
        const expiryText = data.expiryMinutes
            ? `This link will expire in ${data.expiryMinutes} minutes.`
            : 'This link will expire shortly.';

        return this.sendEmail({
            to: email,
            subject: `Password Reset Request for ${appName}`,
            text: `Hello ${data.name},\n\nWe received a request to reset your password. Please click the following link to reset your password:\n\n${data.resetLink}\n\n${expiryText}\n\nIf you didn't request this, please ignore this email.`,
            html: this.generatePasswordResetHTML(data, appName),
        });
    }

    /**
     * Send welcome email
     */
    public async sendWelcome(
        email: string,
        data: WelcomeTemplateData,
        appName: string = 'Crefy Connect',
    ): Promise<boolean> {
        return this.sendEmail({
            to: email,
            subject: `Welcome to ${appName}!`,
            text: `Hello ${
                data.name
            },\n\nWelcome to ${appName}! Your account has been successfully created.\n\n${
                data.loginLink ? `You can login here: ${data.loginLink}` : ''
            }\n\nThank you for joining us!`,
            html: this.generateWelcomeHTML(data, appName),
        });
    }

    /**
     * Send account action notification (deletion, suspension, etc.)
     */
    public async sendAccountAction(
        email: string,
        data: AccountActionTemplateData,
        appName: string = 'Crefy Connect',
    ): Promise<boolean> {
        return this.sendEmail({
            to: email,
            subject: `Account ${data.action} - ${appName}`,
            text: `Hello ${data.name},\n\nYour account has been ${
                data.action
            }.\n\n${
                data.reason ? `Reason: ${data.reason}\n\n` : ''
            }If you have any questions, please contact support.`,
            html: this.generateAccountActionHTML(data, appName),
        });
    }

    /**
     * Send custom notification email
     */
    public async sendNotification(
        email: string,
        title: string,
        message: string,
        appName: string = 'Crefy Connect',
    ): Promise<boolean> {
        return this.sendEmail({
            to: email,
            subject: `${title} - ${appName}`,
            text: message,
            html: this.generateNotificationHTML(title, message, appName),
        });
    }

    /**
     * Verify email transporter configuration
     */
    public async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('Email service connection verified');
            return true;
        } catch (error) {
            console.error('Email service connection failed:', error);
            return false;
        }
    }

    // HTML Template Generators

    private generateOTPHTML(data: OTPTemplateData, appName: string): string {
        const expiryText = data.expiryMinutes
            ? `<p>This OTP will expire in ${data.expiryMinutes} minutes.</p>`
            : '<p>This OTP will expire shortly.</p>';

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">${appName} Verification</h2>
                <p>Hello ${data.name},</p>
                <p>Your verification code is:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">${data.otp}</span>
                </div>
                ${expiryText}
                <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
        `;
    }

    private generatePasswordResetHTML(
        data: PasswordResetTemplateData,
        appName: string,
    ): string {
        const expiryText = data.expiryMinutes
            ? `<p>This link will expire in ${data.expiryMinutes} minutes.</p>`
            : '<p>This link will expire shortly.</p>';

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                <p>Hello ${data.name},</p>
                <p>We received a request to reset your password. Please click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.resetLink}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; display: inline-block;">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:<br>
                <code style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${data.resetLink}</code></p>
                ${expiryText}
                <p style="color: #666; font-size: 14px;">If you didn't request this password reset, please ignore this email.</p>
            </div>
        `;
    }

    private generateWelcomeHTML(
        data: WelcomeTemplateData,
        appName: string,
    ): string {
        const loginSection = data.loginLink
            ? `
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.loginLink}" style="background-color: #4CAF50; color: white; padding: 15px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; display: inline-block;">Get Started</a>
                </div>
            `
            : '';

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Welcome to ${appName}!</h2>
                <p>Hello ${data.name},</p>
                <p>Welcome to ${appName}! Your account has been successfully created and is ready to use.</p>
                ${loginSection}
                <p>We're excited to have you on board!</p>
            </div>
        `;
    }

    private generateAccountActionHTML(
        data: AccountActionTemplateData,
        appName: string,
    ): string {
        const reasonSection = data.reason
            ? `<p><strong>Reason:</strong> ${data.reason}</p>`
            : '';

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Account ${data.action}</h2>
                <p>Hello ${data.name},</p>
                <p>Your account has been <strong>${data.action}</strong>.</p>
                ${reasonSection}
                <p>If you have any questions or believe this was done in error, please contact our support team.</p>
            </div>
        `;
    }

    private generateNotificationHTML(
        title: string,
        message: string,
        appName: string,
    ): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">${title}</h2>
                <div style="line-height: 1.6;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }
}

export default EmailService;
