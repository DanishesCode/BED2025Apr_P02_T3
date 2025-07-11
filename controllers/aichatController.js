const chatModel = require('../models/aichatModel');

const getAIResponse = async (req, res) => {
    try {
        const chatId = req.params.id;
        if (!chatId || typeof chatId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required',
            });
        }
        const { message, userId, name } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required',
            });
        }

        const aiReply = await chatModel.getGeminiResponse(message, name);

        return res.status(200).json({
            success: true,
            reply: aiReply
        });

    } catch (error) {
        console.error('[ChatController] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
        });
    }
};

module.exports = { getAIResponse };
