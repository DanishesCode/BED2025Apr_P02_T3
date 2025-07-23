const WeightModel = require('../models/weightModel');

const WeightController = {
    async addWeightEntry(req, res) {
        try {
            const userId = req.user.userId;
            const { weight, height, age, bmi, date } = req.body;
            if (!weight || !height || !age || !bmi || !date) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }
            const result = await WeightModel.addWeightEntry(userId, date, weight, height, age, bmi);
            if (result.success) {
                res.status(201).json({ success: true });
            } else {
                res.status(500).json({ success: false, message: result.error });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    async getWeightHistory(req, res) {
        try {
            const userId = req.user.userId;
            const result = await WeightModel.getWeightHistory(userId);
            if (result.success) {
                res.json({ success: true, history: result.history });
            } else {
                res.status(500).json({ success: false, message: result.error });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = WeightController; 