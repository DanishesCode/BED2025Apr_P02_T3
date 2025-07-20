const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Helper function for database connection
const getConnection = async () => {
    try {
        return await sql.connect(dbConfig);
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
};

// Helper function to map topic fields
const mapTopicFields = (topic) => ({
    id: topic.id,
    title: topic.title,
    content: topic.content,
    contentType: topic.content_type,
    category: topic.category,
    description: topic.description,
    tags: topic.tags ? JSON.parse(topic.tags) : [],
    createdAt: topic.created_at,
    updatedAt: topic.updated_at,
    author: topic.author,
    userId: topic.user_id || topic.userId,
    likeCount: topic.like_count || 0,
    commentCount: topic.comment_count || 0,
    isLiked: topic.isLiked === 1
});

const topicModel = {
    // Get all topics with filtering and pagination
    getAllTopics: async (filters = {}, limit = 20, offset = 0, currentUserId = null) => {
        try {
            let pool = await getConnection();
            
            let query = `
                SELECT 
                    main.id,
                    main.title,
                    main.content,
                    main.content_type,
                    main.category,
                    main.description,
                    main.tags,
                    main.created_at,
                    ISNULL(likes.like_count, 0) as like_count,
                    ISNULL(comments.comment_count, 0) as comment_count,
                    main.author,
                    main.user_id,
                    ${currentUserId ? 'CASE WHEN user_likes.topicId IS NOT NULL THEN 1 ELSE 0 END as isLiked' : '0 as isLiked'}
                FROM (
                    SELECT 
                        t.id,
                        t.title,
                        t.content,
                        t.content_type,
                        t.category,
                        t.description,
                        t.tags,
                        t.created_at,
                        u.name as author,
                        u.userId as user_id
                    FROM Topics t
                    INNER JOIN Users u ON t.userId = u.userId
                    WHERE 1=1
            `;
            
            const request = pool.request();
            
            if (currentUserId) {
                request.input('currentUserId', sql.Int, currentUserId);
            }
            
            if (filters.category) {
                query += ` AND t.category = @category`;
                request.input('category', sql.VarChar, filters.category);
            }
            
            if (filters.content_type) {
                query += ` AND t.content_type = @contentType`;
                request.input('contentType', sql.VarChar, filters.content_type);
            }
            
            if (filters.search) {
                query += ` AND (t.title LIKE @search OR t.description LIKE @search OR t.tags LIKE @search)`;
                request.input('search', sql.VarChar, `%${filters.search}%`);
            }
            
            query += `
                ) main
                LEFT JOIN (
                    SELECT topicId, COUNT(*) as like_count
                    FROM TopicLikes
                    GROUP BY topicId
                ) likes ON main.id = likes.topicId
                LEFT JOIN (
                    SELECT topicId, COUNT(*) as comment_count
                    FROM TopicComments
                    GROUP BY topicId
                ) comments ON main.id = comments.topicId
                ${currentUserId ? 'LEFT JOIN TopicLikes user_likes ON main.id = user_likes.topicId AND user_likes.userId = @currentUserId' : ''}
                ORDER BY main.created_at DESC 
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            
            request.input('offset', sql.Int, offset);
            request.input('limit', sql.Int, limit);
            
            const result = await request.query(query);
            return result.recordset.map(mapTopicFields);
        } catch (error) {
            console.error('Error in getAllTopics:', error);
            throw error;
        }
    },

    // Get topic by ID
    getTopicById: async (id) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('id', sql.Int, id);
            
            const query = `
                SELECT 
                    t.id,
                    t.title,
                    t.content,
                    t.content_type,
                    t.category,
                    t.description,
                    t.tags,
                    t.created_at,
                    t.updated_at,
                    u.name as author,
                    t.userId
                FROM Topics t
                INNER JOIN Users u ON t.userId = u.userId
                WHERE t.id = @id
            `;
            
            const result = await request.query(query);
            
            if (result.recordset.length === 0) {
                return null;
            }
            
            return mapTopicFields(result.recordset[0]);
        } catch (error) {
            console.error('Error in getTopicById:', error);
            throw error;
        }
    },

    // Create new topic
    createTopic: async (topicData) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('userId', sql.Int, topicData.userId);
            request.input('title', sql.VarChar, topicData.title);
            request.input('content', sql.Text, topicData.content);
            request.input('contentType', sql.VarChar, topicData.content_type);
            request.input('category', sql.VarChar, topicData.category);
            request.input('description', sql.Text, topicData.description);
            request.input('tags', sql.Text, JSON.stringify(topicData.tags));
            
            const query = `
                INSERT INTO Topics (userId, title, content, content_type, category, description, tags)
                VALUES (@userId, @title, @content, @contentType, @category, @description, @tags);
                SELECT SCOPE_IDENTITY() AS id;
            `;
            
            const result = await request.query(query);
            return result.recordset[0].id;
        } catch (error) {
            console.error('Error in createTopic:', error);
            throw error;
        }
    },

    // Update topic
    updateTopic: async (id, updateData) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('id', sql.Int, id);
            
            let updateFields = [];
            
            if (updateData.title) {
                updateFields.push('title = @title');
                request.input('title', sql.VarChar, updateData.title);
            }
            
            if (updateData.category) {
                updateFields.push('category = @category');
                request.input('category', sql.VarChar, updateData.category);
            }
            
            if (updateData.description !== undefined) {
                updateFields.push('description = @description');
                request.input('description', sql.Text, updateData.description);
            }
            
            if (updateData.tags) {
                updateFields.push('tags = @tags');
                request.input('tags', sql.Text, JSON.stringify(updateData.tags));
            }
            
            if (updateFields.length === 0) {
                return;
            }
            
            updateFields.push('updated_at = GETDATE()');
            
            const query = `UPDATE Topics SET ${updateFields.join(', ')} WHERE id = @id`;
            await request.query(query);
        } catch (error) {
            console.error('Error in updateTopic:', error);
            throw error;
        }
    },

    // Delete topic
    deleteTopic: async (id) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('id', sql.Int, id);
            
            const query = 'DELETE FROM Topics WHERE id = @id';
            await request.query(query);
        } catch (error) {
            console.error('Error in deleteTopic:', error);
            throw error;
        }
    },

    // Get topics by user ID
    getTopicsByUserId: async (userId, limit = 20, offset = 0) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('userId', sql.Int, userId);
            request.input('limit', sql.Int, limit);
            request.input('offset', sql.Int, offset);
            
            const query = `
                SELECT 
                    t.id,
                    t.title,
                    t.content,
                    t.content_type,
                    t.category,
                    t.description,
                    t.tags,
                    t.created_at,
                    t.updated_at,
                    u.name as author,
                    t.userId
                FROM Topics t
                INNER JOIN Users u ON t.userId = u.userId
                WHERE t.userId = @userId
                ORDER BY t.created_at DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `;
            
            const result = await request.query(query);
            return result.recordset.map(mapTopicFields);
        } catch (error) {
            console.error('Error in getTopicsByUserId:', error);
            throw error;
        }
    },

    // Get topics by category
    getTopicsByCategory: async (category, limit = 20, offset = 0) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('category', sql.VarChar, category);
            request.input('limit', sql.Int, limit);
            request.input('offset', sql.Int, offset);
            
            const query = `
                SELECT 
                    t.id,
                    t.title,
                    t.content,
                    t.content_type,
                    t.category,
                    t.description,
                    t.tags,
                    t.created_at,
                    t.updated_at,
                    u.name as author,
                    t.userId
                FROM Topics t
                INNER JOIN Users u ON t.userId = u.userId
                WHERE t.category = @category
                ORDER BY t.created_at DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `;
            
            const result = await request.query(query);
            return result.recordset.map(mapTopicFields);
        } catch (error) {
            console.error('Error in getTopicsByCategory:', error);
            throw error;
        }
    },

    // Toggle like
    toggleLike: async (topicId, userId) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('topicId', sql.Int, topicId);
            request.input('userId', sql.Int, userId);
            
            // Check if like exists
            const checkQuery = 'SELECT * FROM TopicLikes WHERE topicId = @topicId AND userId = @userId';
            const checkResult = await request.query(checkQuery);
            
            if (checkResult.recordset.length > 0) {
                // Unlike
                const unlikeQuery = 'DELETE FROM TopicLikes WHERE topicId = @topicId AND userId = @userId';
                await request.query(unlikeQuery);
                
                const newLikeCount = await topicModel.getLikeCount(topicId);
                return { liked: false, likeCount: newLikeCount };
            } else {
                // Like
                const likeQuery = 'INSERT INTO TopicLikes (topicId, userId) VALUES (@topicId, @userId)';
                await request.query(likeQuery);
                
                const newLikeCount = await topicModel.getLikeCount(topicId);
                return { liked: true, likeCount: newLikeCount };
            }
        } catch (error) {
            console.error('Error in toggleLike:', error);
            throw error;
        }
    },

    // Get like count
    getLikeCount: async (topicId) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('topicId', sql.Int, topicId);
            
            const query = 'SELECT COUNT(*) as count FROM TopicLikes WHERE topicId = @topicId';
            const result = await request.query(query);
            
            return result.recordset[0].count;
        } catch (error) {
            console.error('Error in getLikeCount:', error);
            throw error;
        }
    },

    // Add comment
    addComment: async (topicId, userId, comment) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('topicId', sql.Int, topicId);
            request.input('userId', sql.Int, userId);
            request.input('comment', sql.Text, comment);
            
            const query = 'INSERT INTO TopicComments (topicId, userId, comment) VALUES (@topicId, @userId, @comment)';
            await request.query(query);
        } catch (error) {
            console.error('Error in addComment:', error);
            throw error;
        }
    },

    // Get comments
    getComments: async (topicId) => {
        try {
            let pool = await getConnection();
            
            const request = pool.request();
            request.input('topicId', sql.Int, topicId);
            
            const query = `
                SELECT 
                    tc.id,
                    tc.comment,
                    tc.created_at,
                    u.name as author,
                    u.userId
                FROM TopicComments tc
                INNER JOIN Users u ON tc.userId = u.userId
                WHERE tc.topicId = @topicId
                ORDER BY tc.created_at ASC
            `;
            
            const result = await request.query(query);
            return result.recordset.map(comment => ({
                id: comment.id,
                comment: comment.comment,
                createdAt: comment.created_at,
                author: comment.author,
                userId: comment.userId
            }));
        } catch (error) {
            console.error('Error in getComments:', error);
            throw error;
        }
    }
};

module.exports = topicModel;
