// src/config/email-config.ts
import { smtp_config } from './index';
import EmailService from '../services/email-services';

// Create email service instance with your SMTP config
export const emailService = new EmailService({
    host: smtp_config.host,
    port: smtp_config.port,
    secure: smtp_config.secure,
    auth: {
        user: smtp_config.auth.user,
        pass: smtp_config.auth.pass,
    },
    from: smtp_config.from,
});

export default emailService;
