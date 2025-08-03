// Email notification service for appointment reminders
// Uses Brevo (formerly Sendinblue) API for reliable email delivery

const brevo = require('@getbrevo/brevo');

class AppointmentEmailService {
    constructor() {
        // Initialize Brevo API client
        this.apiInstance = new brevo.TransactionalEmailsApi();
        
        // Set API key from environment variables
        this.apiInstance.setApiKey(
            brevo.TransactionalEmailsApiApiKeys.apiKey, 
            process.env.BREVO_API_KEY
        );
        
        this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'Ease4ForLife@gmail.com';
        this.senderName = process.env.BREVO_SENDER_NAME || 'EaseForLife';
    }

    /**
     * Send email using Brevo API
     */
    async sendEmail(recipientEmail, recipientName, subject, htmlContent) {
        try {
            const sendSmtpEmail = new brevo.SendSmtpEmail();
            
            sendSmtpEmail.sender = {
                name: this.senderName,
                email: this.senderEmail
            };
            
            sendSmtpEmail.to = [
                {
                    email: recipientEmail,
                    name: recipientName || 'EaseForLife User'
                }
            ];
            
            sendSmtpEmail.subject = subject;
            sendSmtpEmail.htmlContent = htmlContent;
            
            const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
            
            console.log('Email sent successfully:', result);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('Email sending error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send appointment confirmation email
     */
    async sendAppointmentConfirmation(recipientEmail, recipientName, appointment) {
        // Update consultation type mapping for new doctor preferences
        let consultationType;
        if (appointment.consultationType === 'M') {
            consultationType = 'Male Doctor';
        } else if (appointment.consultationType === 'F') {
            consultationType = 'Female Doctor';
        } else if (appointment.consultationType === 'H') {
            consultationType = 'Health Coach'; // Legacy support
        } else if (appointment.consultationType === 'B') {
            consultationType = 'AI Assistant'; // Legacy support
        } else {
            // Direct mapping for any other values
            consultationType = appointment.consultationType;
        }
        
        // Fix date/time handling - use separate appointmentDate and appointmentTime fields
        const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Parse the time string directly since it's already in HH:MM format
        const appointmentTime = appointment.appointmentTime;

        const subject = `🏥 EaseForLife Appointment Confirmed - ${appointmentDate}`;
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
                .logo { font-size: 32px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
                .appointment-card { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #28a745; }
                .detail-row { display: flex; justify-content: space-between; margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
                .detail-label { font-weight: bold; color: #495057; }
                .detail-value { color: #007bff; font-weight: 500; }
                .meeting-link { background: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold; text-align: center; }
                .meeting-link:hover { background: #218838; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #6c757d; font-size: 14px; }
                .icon { font-size: 24px; margin-right: 10px; }
                .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🏥 EaseForLife</div>
                    <h2 style="color: #28a745; margin: 0;">Appointment Confirmed!</h2>
                </div>
                
                <p>Dear ${recipientName || 'EaseForLife User'},</p>
                
                <p>Your appointment has been successfully scheduled. Here are the details:</p>
                
                <div class="appointment-card">
                    <div class="detail-row">
                        <span class="detail-label">📅 Date:</span>
                        <span class="detail-value">${appointmentDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">⏰ Time:</span>
                        <span class="detail-value">${appointmentTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">👨‍⚕️ Doctor Preference:</span>
                        <span class="detail-value">${consultationType}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">🆔 Appointment ID:</span>
                        <span class="detail-value">#${appointment.id}</span>
                    </div>
                </div>
                
                ${appointment.googleMeetLink ? `
                <div class="highlight">
                    <h3 style="margin-top: 0;">📹 Join Your Video Meeting</h3>
                    <p>Click the button below to join your consultation at the scheduled time:</p>
                    <a href="${appointment.googleMeetLink}" class="meeting-link" target="_blank">
                        🎥 Join Video Meeting
                    </a>
                    <p><small>Meeting Link: <a href="${appointment.googleMeetLink}" target="_blank">${appointment.googleMeetLink}</a></small></p>
                </div>
                ` : ''}
                
                <div style="background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h4 style="margin-top: 0; color: #495057;">📋 What to Expect:</h4>
                    ${consultationType === 'Male Doctor' || consultationType === 'Female Doctor'
                        ? '<ul><li>Professional medical consultation</li><li>Comprehensive health assessment</li><li>Personalized treatment recommendations</li><li>Expert medical guidance</li></ul>'
                        : '<ul><li>Professional medical consultation</li><li>Comprehensive health assessment</li><li>Personalized treatment recommendations</li><li>Expert medical guidance</li></ul>'
                    }
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <p><strong>Need to reschedule or cancel?</strong></p>
                    <p>Please contact us or visit the EaseForLife portal to manage your appointment.</p>
                </div>
                
                <div class="footer">
                    <p><strong>EaseForLife</strong> - Your Health & Wellness Companion</p>
                    <p>Thank you for choosing EaseForLife for your health journey!</p>
                    <p style="font-size: 12px; color: #999;">This is an automated confirmation email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>`;

        return await this.sendEmail(recipientEmail, recipientName, subject, htmlContent);
    }

    /**
     * Send appointment reminder email
     */
    async sendAppointmentReminder(recipientEmail, recipientName, appointment) {
        // Update consultation type mapping for new doctor preferences
        let consultationType;
        if (appointment.consultationType === 'M') {
            consultationType = 'Male Doctor';
        } else if (appointment.consultationType === 'F') {
            consultationType = 'Female Doctor';
        } else if (appointment.consultationType === 'H') {
            consultationType = 'Health Coach'; // Legacy support
        } else if (appointment.consultationType === 'B') {
            consultationType = 'AI Assistant'; // Legacy support
        } else {
            // Direct mapping for any other values
            consultationType = appointment.consultationType;
        }
        
        // Fix date/time handling - use separate appointmentDate and appointmentTime fields
        const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Parse the time string directly since it's already in HH:MM format
        const appointmentTime = appointment.appointmentTime;

        const subject = `⏰ Reminder: Your EaseForLife appointment is tomorrow`;
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
                .header { text-align: center; border-bottom: 3px solid #ffc107; padding-bottom: 20px; margin-bottom: 30px; }
                .reminder-card { background: #fff3cd; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #ffc107; }
                .meeting-link { background: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div style="font-size: 32px; font-weight: bold; color: #ffc107; margin-bottom: 10px;">⏰ EaseForLife</div>
                    <h2 style="color: #856404; margin: 0;">Appointment Reminder</h2>
                </div>
                
                <p>Dear ${recipientName || 'EaseForLife User'},</p>
                
                <p>This is a friendly reminder about your upcoming appointment:</p>
                
                <div class="reminder-card">
                    <h3 style="margin-top: 0;">📅 Tomorrow: ${appointmentDate}</h3>
                    <p><strong>⏰ Time:</strong> ${appointmentTime}</p>
                    <p><strong>👨‍⚕️ Type:</strong> ${consultationType}</p>
                    <p><strong>🆔 ID:</strong> #${appointment.id}</p>
                </div>
                
                ${appointment.googleMeetLink ? `
                <div style="text-align: center;">
                    <a href="${appointment.googleMeetLink}" class="meeting-link" target="_blank">
                        🎥 Join Video Meeting
                    </a>
                </div>
                ` : ''}
                
                <p>We look forward to seeing you tomorrow!</p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #6c757d; font-size: 14px;">
                    <p><strong>EaseForLife</strong> - Your Health & Wellness Companion</p>
                </div>
            </div>
        </body>
        </html>`;

        return await this.sendEmail(recipientEmail, recipientName, subject, htmlContent);
    }
}

module.exports = new AppointmentEmailService();
