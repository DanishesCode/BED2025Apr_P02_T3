const sql = require('mssql');
const dbConfig = require('../dbConfig');

const AppointmentModel = {
    async createAppointment(userId, date, time, consultationType, phoneNumber = null) {
        try {
            const pool = await sql.connect(dbConfig);
            
            // Map consultation type: coach = 'H' (human), ai = 'B' (bot)
            const mappedType = consultationType === 'coach' ? 'H' : 'B';
            
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('appointmentDate', sql.VarChar(10), date)
                .input('appointmentTime', sql.VarChar(10), time)
                .input('consultationType', sql.VarChar(10), mappedType)
                .input('phoneNumber', sql.VarChar(20), phoneNumber)
                .query(`INSERT INTO Appointments (userId, appointmentDate, appointmentTime, consultationType, phoneNumber)
                        OUTPUT INSERTED.*
                        VALUES (@userId, @appointmentDate, @appointmentTime, @consultationType, @phoneNumber)`);
            return { success: true, appointment: result.recordset[0] };
        } catch (err) {
            console.error('Create appointment error:', err);
            return { success: false, error: err.message };
        }
    },

    async updateAppointment(id, userId, date, time, consultationType) {
        try {
            const pool = await sql.connect(dbConfig);
            
            // Map consultation type: coach = 'H' (human), ai = 'B' (bot)
            const mappedType = consultationType === 'coach' ? 'H' : 'B';
            
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