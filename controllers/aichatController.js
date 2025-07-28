const chatModel = require('../models/aichatModel');

const retrieveChats = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const chats = await chatModel.retrieveChats(parseInt(userId));
        
        return res.status(200).json({
            success: true,
            chats: chats || []
        });

    } catch (error) {
        console.error('[ChatController] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
        });
    }
}

const retrieveMessages = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        if (!chatId || isNaN(chatId)) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required and must be a number',
            });
        }

        const messages = await chatModel.retrieveMessages(parseInt(chatId));

        return res.status(200).json({
            success: true,
            messages: messages || []
        });

    } catch (error) {
        console.error('[ChatController] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
        });
    }
}

const saveMessage = async (req, res) => {
    try {
        const { chatId, senderId, message, is_ai } = req.body;

        if (!chatId || isNaN(chatId)) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required and must be a number',
            });
        }

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required',
            });
        }

        // Save the message
        const savedMessageId = await chatModel.saveMessage(chatId, senderId, message, is_ai);

        return res.status(200).json({
            success: true,
            messageId: savedMessageId
        });

    } catch (error) {
        console.error('[ChatController] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
        });
    }
}


const getAIResponse = async (req, res) => {
    try {
        const { message, userId, name } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required',
            });
        }

        // Get AI response
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

const createChat = async (req, res) => {
    try {
        const { userId, title } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required and must be a number',
            });
        }

        // Create the chat
        const chatId = await chatModel.createChat(parseInt(userId), title || 'New Chat');

        return res.status(201).json({
            success: true,
            chatId: chatId
        });

    } catch (error) {
        console.error('[ChatController] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
        });
    }
};

const renameChat = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user?.id || req.body.userId; // Prefer authenticated user, fallback to body
        const { newTitle } = req.body;

        if (!chatId || isNaN(chatId)) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required and must be a number',
            });
        }
        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required and must be a number',
            });
        }
        if (!newTitle || typeof newTitle !== 'string' || newTitle.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'New title is required',
            });
        }

        const updated = await chatModel.renameChat(parseInt(chatId), parseInt(userId), newTitle.trim());
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found or not owned by user',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Chat renamed successfully',
        });
    } catch (error) {
        console.error('[ChatController] Error (renameChat):', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
        });
    }
};

const deleteChat = async (req, res) => {
    try {
        const chatId = req.params.id;
        const userId = req.user?.id || req.body.userId;
        if (!chatId || isNaN(chatId)) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required and must be a number',
            });
        }
        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required and must be a number',
            });
        }
        const deleted = await chatModel.deleteChat(parseInt(chatId), parseInt(userId));
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found or not owned by user',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Chat deleted successfully',
        });
    } catch (error) {
        console.error('[ChatController] Error (deleteChat):', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.',
        });
    }
};

module.exports = { 
    getAIResponse,
    retrieveChats,
    retrieveMessages,
    saveMessage,
    createChat,
    renameChat,
    deleteChat
};
