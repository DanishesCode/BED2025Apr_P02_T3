const sql = require('mssql');
const dbConfig = require('../dbConfig');

const AppointmentModel = {
    async createAppointment(userId, date, time, consultationType, phoneNumber = null) {
        try {
            const pool = await sql.connect(dbConfig);
            
            // Map consultation type for new doctor preferences
            let mappedType;
            if (consultationType === 'male-doctor') {
                mappedType = 'M'; // Male Doctor
            } else if (consultationType === 'female-doctor') {
                mappedType = 'F'; // Female Doctor
            } else {
                // Fallback for any old values
                mappedType = consultationType === 'coach' ? 'H' : 'B';
            }
            
            // Generate a unique meeting link using Jitsi Meet (reliable alternative)
            const meetingId = this.generateMeetingId();
            const meetingLink = `https://meet.jit.si/EaseForLife-Appointment-${meetingId}`;
            
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('appointmentDate', sql.VarChar(10), date)
                .input('appointmentTime', sql.VarChar(10), time)
                .input('consultationType', sql.VarChar(10), mappedType)
                .input('phoneNumber', sql.VarChar(20), phoneNumber)
                .input('googleMeetLink', sql.VarChar(255), meetingLink)
                .query(`INSERT INTO Appointments (userId, appointmentDate, appointmentTime, consultationType, phoneNumber, googleMeetLink)
                        OUTPUT INSERTED.*
                        VALUES (@userId, @appointmentDate, @appointmentTime, @consultationType, @phoneNumber, @googleMeetLink)`);
            return { success: true, appointment: result.recordset[0] };
        } catch (err) {
            console.error('Create appointment error:', err);
            return { success: false, error: err.message };
        }
    },

    // Generate a functional meeting link
    generateMeetingId() {
        // Create a timestamp-based unique ID for reliable meeting rooms
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        // Create unique room ID: YYYYMMDD-TIMESTAMP-RANDOM
        return `${dateStr}-${timestamp}-${randomString}`;
    },

    async updateAppointment(id, userId, date, time, consultationType) {
        try {
            const pool = await sql.connect(dbConfig);
            
            // Map consultation type for new doctor preferences
            let mappedType;
            if (consultationType === 'male-doctor') {
                mappedType = 'M'; // Male Doctor
            } else if (consultationType === 'female-doctor') {
                mappedType = 'F'; // Female Doctor
            } else {
                // Fallback for any old values
                mappedType = consultationType === 'coach' ? 'H' : 'B';
            }
            
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('userId', sql.Int, userId)
                .input('appointmentDate', sql.VarChar(10), date)
                .input('appointmentTime', sql.VarChar(10), time)
                .input('consultationType', sql.VarChar(10), mappedType)
                .query(`UPDATE Appointments
                        SET appointmentDate = @appointmentDate, appointmentTime = @appointmentTime, consultationType = @consultationType
                        OUTPUT INSERTED.*
                        WHERE id = @id AND userId = @userId`);
            return { success: true, appointment: result.recordset[0] };
        } catch (err) {
            console.error('Update appointment error:', err);
            return { success: false, error: err.message };
        }
    },

    async deleteAppointment(id, userId) {
        try {
            const pool = await sql.connect(dbConfig);
            await pool.request()
                .input('id', sql.Int, id)
                .input('userId', sql.Int, userId)
                .query(`DELETE FROM Appointments WHERE id = @id AND userId = @userId`);
            return { success: true };
        } catch (err) {
            console.error('Delete appointment error:', err);
            return { success: false, error: err.message };
        }
    },

    async listAppointments(userId) {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT * FROM Appointments WHERE userId = @userId ORDER BY appointmentDate, appointmentTime`);
            return { success: true, appointments: result.recordset };
        } catch (err) {
            console.error('List appointments error:', err);
            return { success: false, error: err.message };
        }
    }
};

module.exports = AppointmentModel; 