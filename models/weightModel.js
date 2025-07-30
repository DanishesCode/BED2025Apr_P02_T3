const sql = require('mssql');
const dbConfig = require('../dbConfig');

const WeightModel = {
    async addWeightEntry(userId, date, weight, height, age, bmi) {
        try {
            const pool = await sql.connect(dbConfig);
            
            // Check if entry already exists for this user and date
            const existingEntry = await pool.request()
                .input('userId', sql.Int, userId)
                .input('date', sql.Date, date)
                .query(`SELECT id FROM WeightHistory WHERE userId = @userId AND date = @date`);

            if (existingEntry.recordset.length > 0) {
                // Update existing entry
                const result = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('date', sql.Date, date)
                    .input('weight', sql.Float, weight)
                    .input('height', sql.Float, height)
                    .input('age', sql.Int, age)
                    .input('bmi', sql.Float, bmi)
                    .query(`UPDATE WeightHistory 
                            SET weight = @weight, height = @height, age = @age, bmi = @bmi
                            WHERE userId = @userId AND date = @date`);
                return { success: true, message: 'Weight entry updated successfully' };
            } else {
                // Create new entry
                const result = await pool.request()
                    .input('userId', sql.Int, userId)
                    .input('date', sql.Date, date)
                    .input('weight', sql.Float, weight)
                    .input('height', sql.Float, height)
                    .input('age', sql.Int, age)
                    .input('bmi', sql.Float, bmi)
                    .query(`INSERT INTO WeightHistory (userId, date, weight, height, age, bmi)
                            VALUES (@userId, @date, @weight, @height, @age, @bmi)`);
                return { success: true, message: 'Weight entry added successfully' };
            }
        } catch (error) {
            console.error('addWeightEntry error:', error);
            return { success: false, error: error.message };
        } finally {
            try {
                await sql.close();
            } catch (e) {
                console.error('Error closing connection:', e);
            }
        }
    },

    async getWeightHistory(userId) {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT * FROM WeightHistory WHERE userId = @userId ORDER BY date DESC`);
            return { success: true, history: result.recordset };
        } catch (error) {
            console.error('getWeightHistory error:', error);
            return { success: false, error: error.message };
        } finally {
            try {
                await sql.close();
            } catch (e) {
                console.error('Error closing connection:', e);
            }
        }
    },

    async getLatestEntry(userId) {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT TOP 1 * FROM WeightHistory WHERE userId = @userId ORDER BY date DESC`);
            return { success: true, entry: result.recordset[0] || null };
        } catch (error) {
            console.error('getLatestEntry error:', error);
            return { success: false, error: error.message };
        } finally {
            try {
                await sql.close();
            } catch (e) {
                console.error('Error closing connection:', e);
            }
        }
    }
};

module.exports = WeightModel; 