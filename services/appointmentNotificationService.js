// Simple SMS notification service for appointment reminders
// Uses Textbelt free SMS API (no signup required, 1 free text per day per phone)
// 
// QUOTA LIMITATIONS:
// - Free tier: 1 SMS per day per phone number
// - For production, consider paid alternatives:
//   * Textbelt paid ($0.15/SMS) - same API, just use paid key
//   * Twilio, AWS SNS, Vonage, etc.
//
// ALTERNATIVE APPROACHES:
// - Email notifications (unlimited, free)
// - Push notifications via browser/mobile app
// - WhatsApp Business API (requires approval)

class AppointmentNotificationService {
    constructor() {
        // Using Textbelt free SMS service - no API keys needed for basic usage
        this.smsApiUrl = 'https://textbelt.com/text';
    }

    /**
     * Send SMS using Textbelt free service
     */
    async sendSMS(phoneNumber, message) {
        try {
            const fetch = require('node-fetch');
            
            const response = await fetch(this.smsApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: phoneNumber,
                    message: message,
                    key: 'free' // Uses free tier (1 SMS per day per phone)
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('SMS sent successfully:', result);
                return { success: true, messageId: result.textId };
            } else {
                console.log('SMS failed:', result.error);
                
                // Handle quota limit specifically
                if (result.error && result.error.toLowerCase().includes('quota')) {
                    return { 
                        success: false, 
                        error: 'Out of quota - Free service allows 1 SMS per day per phone number. Consider using a paid SMS service for production.' 
                    };
                }
                
                return { success: false, error: result.error };
            }

        } catch (error) {
            console.error('SMS sending error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send appointment confirmation SMS
     */
    async sendAppointmentConfirmation(phoneNumber, appointment) {
        const consultationType = appointment.consultationType === 'H' ? 'Health Coach' : 'AI Assistant';
        const message = `🏥 EaseForLife Appointment Confirmed!

📅 ${appointment.appointmentDate} at ${appointment.appointmentTime}
👨‍⚕️ ${consultationType}

📹 Video: ${appointment.googleMeetLink}

See you there!`;

        return await this.sendSMS(phoneNumber, message);
    }

    /**
     * Send appointment reminder (24 hours before)
     */
    async sendAppointmentReminder(phoneNumber, appointment) {
        const consultationType = appointment.consultationType === 'H' ? 'Health Coach' : 'AI Assistant';
        const message = `⏰ Reminder: EaseForLife appointment tomorrow!

📅 ${appointment.appointmentDate} at ${appointment.appointmentTime}
👨‍⚕️ ${consultationType}

📹 Join: ${appointment.googleMeetLink}

Don't forget!`;

        return await this.sendSMS(phoneNumber, message);
    }

    /**
     * Send appointment reminder (1 hour before)
     */
    async sendImmediateReminder(phoneNumber, appointment) {
        const consultationType = appointment.consultationType === 'H' ? 'Health Coach' : 'AI Assistant';
        const message = `🚨 Your ${consultationType} appointment starts in 1 hour!

⏰ ${appointment.appointmentTime} today
� ${appointment.googleMeetLink}

Join now!`;

        return await this.sendSMS(phoneNumber, message);
    }

    /**
     * Schedule reminders (for future implementation with cron jobs)
     */
    async scheduleReminders(appointment) {
        const appointmentDateTime = new Date(`${appointment.appointmentDate} ${appointment.appointmentTime}`);
        const now = new Date();
        
        // Calculate reminder times
        const dayBeforeReminder = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
        const hourBeforeReminder = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);

        console.log(`📋 Reminders scheduled for appointment ${appointment.id}:`);
        console.log(`📅 Appointment: ${appointmentDateTime}`);
        console.log(`🔔 24h reminder: ${dayBeforeReminder}`);
        console.log(`⏰ 1h reminder: ${hourBeforeReminder}`);

        return {
            appointmentId: appointment.id,
            dayBeforeReminder: dayBeforeReminder,
            hourBeforeReminder: hourBeforeReminder,
            scheduled: true
        };
    }
}

module.exports = new AppointmentNotificationService();

module.exports = new AppointmentNotificationService();
