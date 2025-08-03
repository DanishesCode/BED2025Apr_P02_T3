const AppointmentModel = require('../models/appointmentModel');
const notificationService = require('../services/appointmentNotificationService');

const AppointmentController = {
    async create(req, res) {
        try {
            const userId = req.user.userId;
            const { date, time, consultationType, phoneNumber } = req.body;
            
            // Check for required fields
            if (!date || !time || !consultationType) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date, time, and consultation type are required.',
                    error: 'MISSING_REQUIRED_FIELDS'
                });
            }

            // Validate phone number if provided
            if (phoneNumber) {
                const phoneRegex = /^\+[1-9]\d{1,14}$/;
                if (!phoneRegex.test(phoneNumber)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please provide a valid phone number with country code.',
                        error: 'INVALID_PHONE_NUMBER'
                    });
                }
            }

            // Validate date format
            if (isNaN(Date.parse(date))) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid date.',
                    error: 'INVALID_DATE_FORMAT'
                });
            }

            // Check if date is not in the past
            const appointmentDate = new Date(date + ' ' + time);
            const now = new Date();
            if (appointmentDate <= now) {
                return res.status(400).json({
                    success: false,
                    message: 'Appointment date and time must be in the future.',
                    error: 'PAST_DATE_NOT_ALLOWED'
                });
            }

            // Validate time format (basic check)
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid time in HH:MM format.',
                    error: 'INVALID_TIME_FORMAT'
                });
            }

            // Validate consultation type
            const validTypes = ['coach', 'ai'];
            if (!validTypes.includes(consultationType.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: 'Consultation type must be either "coach" or "ai".',
                    error: 'INVALID_CONSULTATION_TYPE'
                });
            }

            const result = await AppointmentModel.createAppointment(userId, date, time, consultationType, phoneNumber);
            
            if (result.success) {
                let responseData = { 
                    success: true, 
                    message: 'Appointment created successfully',
                    appointment: result.appointment
                };

                // Send confirmation SMS if phone number is provided
                if (phoneNumber && result.appointment) {
                    try {
                        const notificationResult = await notificationService.sendAppointmentConfirmation(
                            phoneNumber, 
                            result.appointment
                        );
                        
                        if (notificationResult.success) {
                            responseData.notificationSent = true;
                            responseData.notification = '📱 Confirmation SMS sent to your phone!';
                        } else {
                            responseData.notificationSent = false;
                            responseData.notification = 'Appointment created but SMS failed to send';
                        }
                    } catch (notificationError) {
                        console.error('Notification error:', notificationError);
                        responseData.notificationSent = false;
                        responseData.notification = 'Appointment created but SMS notification failed';
                    }
                } else {
                    responseData.notification = 'Appointment created successfully';
                }

                res.status(201).json(responseData);
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: result.error || 'Failed to create appointment.',
                    error: 'APPOINTMENT_CREATION_FAILED'
                });
            }
        } catch (error) {
            console.error('Create appointment error:', error);
            
            // Handle specific database errors
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'An appointment already exists for this date and time.',
                    error: 'DUPLICATE_APPOINTMENT'
                });
            }
            
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user data.',
                    error: 'INVALID_USER_DATA'
                });
            }

            res.status(500).json({ 
                success: false, 
                message: 'Internal server error. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    },

    async update(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const { date, time, consultationType } = req.body;
            
            // Validate appointment ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid appointment ID is required.',
                    error: 'INVALID_APPOINTMENT_ID'
                });
            }

            // Check for required fields
            if (!date || !time || !consultationType) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Date, time, and consultation type are required.',
                    error: 'MISSING_REQUIRED_FIELDS'
                });
            }

            // Validate date format
            if (isNaN(Date.parse(date))) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid date.',
                    error: 'INVALID_DATE_FORMAT'
                });
            }

            // Check if date is not in the past
            const appointmentDate = new Date(date + ' ' + time);
            const now = new Date();
            if (appointmentDate <= now) {
                return res.status(400).json({
                    success: false,
                    message: 'Appointment date and time must be in the future.',
                    error: 'PAST_DATE_NOT_ALLOWED'
                });
            }

            // Validate time format
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(time)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid time in HH:MM format.',
                    error: 'INVALID_TIME_FORMAT'
                });
            }

            // Validate consultation type
            const validTypes = ['coach', 'ai'];
            if (!validTypes.includes(consultationType.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    message: 'Consultation type must be either "coach" or "ai".',
                    error: 'INVALID_CONSULTATION_TYPE'
                });
            }

            const result = await AppointmentModel.updateAppointment(id, userId, date, time, consultationType);
            
            if (result.success) {
                res.json({ 
                    success: true, 
                    message: 'Appointment updated successfully',
                    appointment: result.appointment 
                });
            } else {
                if (result.error && result.error.includes('not found')) {
                    return res.status(404).json({
                        success: false,
                        message: 'Appointment not found or you do not have permission to update it.',
                        error: 'APPOINTMENT_NOT_FOUND'
                    });
                }
                res.status(400).json({ 
                    success: false, 
                    message: result.error || 'Failed to update appointment.',
                    error: 'APPOINTMENT_UPDATE_FAILED'
                });
            }
        } catch (error) {
            console.error('Update appointment error:', error);
            
            // Handle specific database errors
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'An appointment already exists for this date and time.',
                    error: 'DUPLICATE_APPOINTMENT'
                });
            }

            res.status(500).json({ 
                success: false, 
                message: 'Internal server error. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    },

    async delete(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            
            // Validate appointment ID
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid appointment ID is required.',
                    error: 'INVALID_APPOINTMENT_ID'
                });
            }

            const result = await AppointmentModel.deleteAppointment(id, userId);
            
            if (result.success) {
                res.json({ 
                    success: true,
                    message: 'Appointment deleted successfully'
                });
            } else {
                if (result.error && result.error.includes('not found')) {
                    return res.status(404).json({
                        success: false,
                        message: 'Appointment not found or you do not have permission to delete it.',
                        error: 'APPOINTMENT_NOT_FOUND'
                    });
                }
                res.status(400).json({ 
                    success: false, 
                    message: result.error || 'Failed to delete appointment.',
                    error: 'APPOINTMENT_DELETION_FAILED'
                });
            }
        } catch (error) {
            console.error('Delete appointment error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    },

    async list(req, res) {
        try {
            const userId = req.user.userId;
            
            // Validate user ID
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required.',
                    error: 'MISSING_USER_ID'
                });
            }

            const result = await AppointmentModel.listAppointments(userId);
            
            if (result.success) {
                res.json({ 
                    success: true, 
                    appointments: result.appointments || [],
                    message: result.appointments && result.appointments.length > 0 
                        ? 'Appointments retrieved successfully' 
                        : 'No appointments found'
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: result.error || 'Failed to retrieve appointments.',
                    error: 'APPOINTMENTS_RETRIEVAL_FAILED'
                });
            }
        } catch (error) {
            console.error('List appointments error:', error);
            
            // Handle specific database errors
            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                return res.status(503).json({
                    success: false,
                    message: 'Database connection error. Please try again later.',
                    error: 'DATABASE_CONNECTION_ERROR'
                });
            }

            res.status(500).json({ 
                success: false, 
                message: 'Internal server error. Please try again later.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    },

    // Test SMS notification endpoint
    async testSMS(req, res) {
        try {
            const { phoneNumber } = req.body;
            
            if (!phoneNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number is required.',
                    error: 'MISSING_PHONE_NUMBER'
                });
            }

            // Validate phone number format
            const phoneRegex = /^\+[1-9]\d{1,14}$/;
            if (!phoneRegex.test(phoneNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid phone number with country code.',
                    error: 'INVALID_PHONE_NUMBER'
                });
            }

            const result = await notificationService.sendTestMessage(phoneNumber);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: 'Test SMS sent successfully!',
                    messageId: result.messageId
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to send test SMS: ' + result.error,
                    error: 'SMS_SEND_FAILED'
                });
            }

        } catch (error) {
            console.error('Test SMS error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error.',
                error: 'INTERNAL_SERVER_ERROR'
            });
        }
    }
};

module.exports = AppointmentController; 