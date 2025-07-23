const sql = require('mssql');
const dbConfig = require('../dbConfig');

const WeightModel = {
    async addWeightEntry(userId, date, weight, height, age, bmi) {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('date', sql.Date, date)
                .input('weight', sql.Float, weight)
                .input('height', sql.Float, height)
                .input('age', sql.Int, age)
                .input('bmi', sql.Float, bmi)
                .query(`INSERT INTO WeightHistory (userId, date, weight, height, age, bmi)
                        VALUES (@userId, @date, @weight, @height, @age, @bmi)`);
            return { success: true };
        } catch (error) {
            console.error('addWeightEntry error:', error);
            return { success: false, error: error.message };
        }
    },
    async getWeightHistory(userId) {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`SELECT * FROM WeightHistory WHERE userId = @userId ORDER BY date ASC`);
            return { success: true, history: result.recordset };
        } catch (error) {
            console.error('getWeightHistory error:', error);
            return { success: false, error: error.message };
        }
    }
};

module.exports = WeightModel; 