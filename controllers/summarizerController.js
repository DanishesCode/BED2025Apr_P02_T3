const summarizerModel = require('../models/summarizerModel');

exports.summarizeText = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string' || text.length < 50) {
            return res.status(400).json({ success: false, error: 'Please provide at least 50 characters of text.' });
        }
        const summary = await summarizerModel.summarize(text);
        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Summarization failed.' });
    }
};