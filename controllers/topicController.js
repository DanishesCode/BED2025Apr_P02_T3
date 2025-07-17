const topicModel = require('../models/topicModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/topics';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

const topicController = {
    // Get all topics
    getAllTopics: async (req, res) => {
        try {
            const { category, contentType, search, limit = 20, offset = 0 } = req.query;
            
            const filters = {};
            if (category && category !== 'all') filters.category = category;
            if (contentType && contentType !== 'all') filters.content_type = contentType;
            if (search) filters.search = search;
            
            const topics = await topicModel.getAllTopics(filters, limit, offset);
            
            res.status(200).json({
                success: true,
                data: topics,
                message: 'Topics retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching topics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch topics',
                error: error.message
            });
        }
    },

    // Get topic by ID
    getTopicById: async (req, res) => {
        try {
            const { id } = req.params;
            
            const topic = await topicModel.getTopicById(id);
            
            if (!topic) {
                return res.status(404).json({
                    success: false,
                    message: 'Topic not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: topic,
                message: 'Topic retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching topic:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch topic',
                error: error.message
            });
        }
    },

    // Create new topic
    createTopic: async (req, res) => {
        try {
            console.log('=== CREATE TOPIC REQUEST ===');
            console.log('Request body:', req.body);
            console.log('Request file:', req.file);
            console.log('Request user:', req.user);
            
            const userId = req.user.userId;  // Changed from req.user.id to req.user.userId
            const { title, category, contentType, description, tags } = req.body;
            
            console.log('Extracted data:', { userId, title, category, contentType, description, tags });
            
            if (!title || !contentType) {
                return res.status(400).json({
                    success: false,
                    message: 'Title and content type are required'
                });
            }
            
            let content = '';
            
            if (contentType === 'text') {
                content = req.body.textContent;
                if (!content) {
                    return res.status(400).json({
                        success: false,
                        message: 'Text content is required for text type'
                    });
                }
            } else {
                // For image/video, content will be the file path
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'File is required for image/video type'
                    });
                }
                content = `/uploads/topics/${req.file.filename}`;
            }
            
            const topicData = {
                userId: userId,  // Changed from user_id to userId
                title,
                content,
                content_type: contentType,
                category: category || 'general',
                description: description || null,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : []
            };
            
            const topicId = await topicModel.createTopic(topicData);
            
            res.status(201).json({
                success: true,
                data: { id: topicId },
                message: 'Topic created successfully'
            });
        } catch (error) {
            console.error('Error creating topic:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create topic',
                error: error.message
            });
        }
    },

    // Update topic
    updateTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const { title, category, description, tags } = req.body;
            
            // Check if topic exists and belongs to user
            const existingTopic = await topicModel.getTopicById(id);
            if (!existingTopic) {
                return res.status(404).json({
                    success: false,
                    message: 'Topic not found'
                });
            }
            
            if (existingTopic.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update your own topics'
                });
            }
            
            const updateData = {};
            if (title) updateData.title = title;
            if (category) updateData.category = category;
            if (description !== undefined) updateData.description = description;
            if (tags !== undefined) updateData.tags = tags.split(',').map(tag => tag.trim());
            
            await topicModel.updateTopic(id, updateData);
            
            res.status(200).json({
                success: true,
                message: 'Topic updated successfully'
            });
        } catch (error) {
            console.error('Error updating topic:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update topic',
                error: error.message
            });
        }
    },

    // Delete topic
    deleteTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            
            // Check if topic exists and belongs to user
            const existingTopic = await topicModel.getTopicById(id);
            if (!existingTopic) {
                return res.status(404).json({
                    success: false,
                    message: 'Topic not found'
                });
            }
            
            if (existingTopic.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own topics'
                });
            }
            
            // Delete associated file if it exists
            if (existingTopic.content_type !== 'text' && existingTopic.content) {
                const filePath = path.join(__dirname, '..', 'public', existingTopic.content);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            
            await topicModel.deleteTopic(id);
            
            res.status(200).json({
                success: true,
                message: 'Topic deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting topic:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete topic',
                error: error.message
            });
        }
    },

    // Get user's topics
    getUserTopics: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { limit = 20, offset = 0 } = req.query;
            
            const topics = await topicModel.getTopicsByUserId(userId, limit, offset);
            
            res.status(200).json({
                success: true,
                data: topics,
                message: 'User topics retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching user topics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch user topics',
                error: error.message
            });
        }
    },

    // Get topics by category
    getTopicsByCategory: async (req, res) => {
        try {
            const { category } = req.params;
            const { limit = 20, offset = 0 } = req.query;
            
            const topics = await topicModel.getTopicsByCategory(category, limit, offset);
            
            res.status(200).json({
                success: true,
                data: topics,
                message: 'Topics retrieved successfully'
            });
        } catch (error) {
            console.error('Error fetching topics by category:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch topics',
                error: error.message
            });
        }
    },

    // Upload middleware
    uploadFile: upload.single('file')
};

module.exports = topicController;
