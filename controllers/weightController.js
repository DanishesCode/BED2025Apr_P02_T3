const WeightModel = require('../models/weightModel');

const WeightController = {
    async addWeightEntry(req, res) {
        try {
            const userId = req.user.userId;
            const { weight, height, bmi, date } = req.body;
            
            // Check for required fields
            if (!weight || !height || !bmi || !date) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'All fields (weight, height, bmi, date) are required.',
                    error: 'MISSING_REQUIRED_FIELDS'
                });
            }

            // Get user's date of birth to calculate age
            const sql = require('mssql');
            const dbConfig = require('../dbConfig');
            const pool = await sql.connect(dbConfig);
            
            const userResult = await pool.request()
                .input('userId', sql.Int, userId)
                .query('SELECT date_of_birth FROM Users WHERE userId = @userId');
            
            if (userResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found.',
                    error: 'USER_NOT_FOUND'
                });
            }

            // Calculate age from date of birth
            const dob = new Date(userResult.recordset[0].date_of_birth);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            // Validate numeric values
            if (isNaN(weight) || weight <= 0 || weight > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Weight must be a valid positive number between 1 and 1000 kg.',
                    error: 'INVALID_WEIGHT'
                });
            }

            if (isNaN(height) || height <= 0 || height > 300) {
                return res.status(400).json({
                    success: false,
                    message: 'Height must be a valid positive number between 1 and 300 cm.',
                    error: 'INVALID_HEIGHT'
                });
            }

            if (isNaN(bmi) || bmi <= 0 || bmi > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'BMI must be a valid positive number between 1 and 100.',
                    error: 'INVALID_BMI'
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

            // Check if date is not in the future
            const inputDate = new Date(date);
            const todayCheck = new Date();
            if (inputDate > todayCheck) {
                return res.status(400).json({
                    success: false,
                    message: 'Date cannot be in the future.',
                    error: 'FUTURE_DATE_NOT_ALLOWED'
                });
            }

            const result = await WeightModel.addWeightEntry(userId, date, weight, height, age, bmi);
            
            if (result.success) {
                res.status(201).json({ 
                    success: true,
                    message: result.message || 'Weight entry saved successfully',
                    data: { age: age }
                });
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: result.error || 'Failed to add weight entry.',
                    error: 'WEIGHT_ENTRY_FAILED'
                });
            }
        } catch (error) {
            console.error('Add weight entry error:', error);
            
            // Handle specific database errors
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'A weight entry for this date already exists.',
                    error: 'DUPLICATE_ENTRY'
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

    async getWeightHistory(req, res) {
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

            const result = await WeightModel.getWeightHistory(userId);
            
            if (result.success) {
                res.json({ 
                    success: true, 
                    history: result.history || [],
                    message: result.history && result.history.length > 0 
                        ? 'Weight history retrieved successfully' 
                        : 'No weight entries found'
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    message: result.error || 'Failed to retrieve weight history.',
                    error: 'HISTORY_RETRIEVAL_FAILED'
                });
            }
        } catch (error) {
            console.error('Get weight history error:', error);
            
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
    }
};

module.exports = WeightController; 