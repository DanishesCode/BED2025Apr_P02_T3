
const topicModel = require('../models/topicModel');
const multer = require('multer');
const cloudinary = require('../cloudinaryConfig');
const streamifier = require('streamifier');

// Multer memory storage for direct buffer upload to Cloudinary
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed!'), false);
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 }
}).single('file');

// Helper functions
const sendResponse = (res, status, success, message, data = null) => {
    const response = { success, message };
    if (data) response.data = data;
    return res.status(status).json(response);
};

const handleError = (res, error, message = 'Operation failed') => {
    console.error(message, error);
    return sendResponse(res, 500, false, message, error.message);
};

const uploadFile = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return sendResponse(res, 400, false, 'File upload error', err.message);
        }
        next();
    });
};

const topicController = {
    // Get all topics
    getAllTopics: async (req, res) => {
        try {
            const { category, contentType, search, limit = 20, offset = 0 } = req.query;
            const currentUserId = req.user ? req.user.userId : null;
            
            const filters = {};
            if (category && category !== 'all') filters.category = category;
            if (contentType && contentType !== 'all') filters.content_type = contentType;
            if (search) filters.search = search;
            
            const topics = await topicModel.getAllTopics(filters, limit, offset, currentUserId);
            return sendResponse(res, 200, true, 'Topics retrieved successfully', topics);
        } catch (error) {
            return handleError(res, error, 'Failed to fetch topics');
        }
    },

    // Get topic by ID
    getTopicById: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return sendResponse(res, 400, false, 'Invalid topic ID');
            }
            
            const topic = await topicModel.getTopicById(id);
            
            if (!topic) {
                return sendResponse(res, 404, false, 'Topic not found');
            }
            
            return sendResponse(res, 200, true, 'Topic retrieved successfully', topic);
        } catch (error) {
            return handleError(res, error, 'Failed to fetch topic');
        }
    },

    // Create new topic (Cloudinary for image/video)
    createTopic: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendResponse(res, 401, false, 'Authentication required');
            }
            
            const { title, category, contentType, description, tags } = req.body;
            
            if (!title || !title.trim()) {
                return sendResponse(res, 400, false, 'Title is required');
            }
            
            if (!contentType) {
                return sendResponse(res, 400, false, 'Content type is required');
            }
            
            let content = '';
            if (contentType === 'text') {
                content = req.body.textContent;
                if (!content || !content.trim()) {
                    return sendResponse(res, 400, false, 'Text content is required for text type');
                }
            } else {
                if (!req.file) {
                    return sendResponse(res, 400, false, 'File is required for image/video type');
                }
                // Upload to Cloudinary
                const uploadPromise = () => new Promise((resolve, reject) => {
                    let resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
                    let stream = cloudinary.uploader.upload_stream(
                        { resource_type: resourceType, folder: 'topics' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
                const result = await uploadPromise();
                content = result.secure_url;
            }
            
            const topicData = {
                userId,
                title: title.trim(),
                content,
                content_type: contentType,
                category: category || 'general',
                description: description || null,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : []
            };
            
            const topicId = await topicModel.createTopic(topicData);
            return sendResponse(res, 201, true, 'Topic created successfully', { id: topicId });
        } catch (error) {
            return handleError(res, error, 'Failed to create topic');
        }
    },

    // Update topic (Cloudinary for image/video)
    updateTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            
            if (!userId) {
                return sendResponse(res, 401, false, 'Authentication required');
            }
            
            if (!id || isNaN(parseInt(id))) {
                return sendResponse(res, 400, false, 'Invalid topic ID');
            }
            
            const { title, category, description, tags } = req.body;
            const existingTopic = await topicModel.getTopicById(id);
            
            if (!existingTopic) {
                return sendResponse(res, 404, false, 'Topic not found');
            }
            
            if (existingTopic.userId !== userId) {
                return sendResponse(res, 403, false, 'You can only update your own topics');
            }
            
            const updateData = {};
            if (title) updateData.title = title.trim();
            if (category) updateData.category = category;
            if (description !== undefined) updateData.description = description;
            if (tags !== undefined) updateData.tags = tags.split(',').map(tag => tag.trim());

            let newContentUrl = null;
            // Only handle file upload for non-text topics
            if (existingTopic.contentType !== 'text' && req.file) {
                // Upload new file to Cloudinary
                const uploadPromise = () => new Promise((resolve, reject) => {
                    let resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
                    let stream = cloudinary.uploader.upload_stream(
                        { resource_type: resourceType, folder: 'topics' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
                const result = await uploadPromise();
                newContentUrl = result.secure_url;
                updateData.content = newContentUrl;
            }

            await topicModel.updateTopic(id, updateData);
            // Return new content url if updated, else old one
            return sendResponse(res, 200, true, 'Topic updated successfully', {
                content: newContentUrl || existingTopic.content
            });
        } catch (error) {
            return handleError(res, error, 'Failed to update topic');
        }
    },

    // Delete topic (no local file deletion, Cloudinary cleanup optional)
    deleteTopic: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            
            if (!userId) {
                return sendResponse(res, 401, false, 'Authentication required');
            }
            
            if (!id || isNaN(parseInt(id))) {
                return sendResponse(res, 400, false, 'Invalid topic ID');
            }
            
            const existingTopic = await topicModel.getTopicById(id);
            
            if (!existingTopic) {
                return sendResponse(res, 404, false, 'Topic not found');
            }
            
            if (existingTopic.userId !== userId) {
                return sendResponse(res, 403, false, 'You can only delete your own topics');
            }
            
            // Optionally: delete from Cloudinary using public_id (not implemented here)
            await topicModel.deleteTopic(id);
            return sendResponse(res, 200, true, 'Topic deleted successfully');
        } catch (error) {
            return handleError(res, error, 'Failed to delete topic');
        }
    },

    // Get user's topics
    getUserTopics: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendResponse(res, 401, false, 'Authentication required');
            }
            
            const { limit = 20, offset = 0 } = req.query;
            
            const topics = await topicModel.getTopicsByUserId(userId, limit, offset);
            return sendResponse(res, 200, true, 'User topics retrieved successfully', topics);
        } catch (error) {
            return handleError(res, error, 'Failed to fetch user topics');
        }
    },

    // Get topics by category
    getTopicsByCategory: async (req, res) => {
        try {
            const { category } = req.params;
            const { limit = 20, offset = 0 } = req.query;
            
            if (!category || !category.trim()) {
                return sendResponse(res, 400, false, 'Category parameter is required');
            }
            
            const topics = await topicModel.getTopicsByCategory(category, limit, offset);
            return sendResponse(res, 200, true, 'Topics retrieved successfully', topics);
        } catch (error) {
            return handleError(res, error, 'Failed to fetch topics');
        }
    },

    // Toggle like (unified endpoint)
    toggleLike: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            
            if (!userId) {
                return sendResponse(res, 401, false, 'Authentication required');
            }
            
            if (!id || isNaN(parseInt(id))) {
                return sendResponse(res, 400, false, 'Invalid topic ID');
            }
            
            const result = await topicModel.toggleLike(id, userId);
            return sendResponse(res, 200, true, 
                result.liked ? 'Topic liked successfully' : 'Topic unliked successfully',
                { liked: result.liked, likeCount: result.likeCount }
            );
        } catch (error) {
            return handleError(res, error, 'Failed to toggle like');
        }
    },

    // Add comment to topic
    addComment: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.userId;
            const { comment } = req.body;
            
            if (!userId) {
                return sendResponse(res, 401, false, 'Authentication required');
            }
            
            if (!id || isNaN(parseInt(id))) {
                return sendResponse(res, 400, false, 'Invalid topic ID');
            }
            
            if (!comment || comment.trim() === '') {
                return sendResponse(res, 400, false, 'Comment cannot be empty');
            }
            
            await topicModel.addComment(id, userId, comment.trim());
            return sendResponse(res, 200, true, 'Comment added successfully');
        } catch (error) {
            return handleError(res, error, 'Failed to add comment');
        }
    },

    // Get comments for topic
    getComments: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return sendResponse(res, 400, false, 'Invalid topic ID');
            }
            
            const comments = await topicModel.getComments(id);
            return sendResponse(res, 200, true, 'Comments retrieved successfully', comments);
        } catch (error) {
            return handleError(res, error, 'Failed to get comments');
        }
    },

    // Upload middleware
    uploadFile: uploadFile
};

module.exports = topicController;
