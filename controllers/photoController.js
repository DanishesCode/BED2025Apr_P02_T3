const photoModel = require("../models/photoModel");

// Helper function to convert image buffer to base64
const convertToBase64 = (imageBuffer) => {
  if (!imageBuffer) return null;
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
};

// Helper function for error responses
const sendError = (res, status, message, error = null) => {
  const response = { success: false, message };
  if (error) response.error = error.message;
  return res.status(status).json(response);
};

// Helper function for success responses
const sendSuccess = (res, status, message, data = null) => {
  const response = { success: true, message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

const photoController = {
  // Upload a new photo
  async uploadPhoto(req, res) {
    console.log("=== [UPLOAD PHOTO ROUTE HIT] ===");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    console.log("Request user:", req.user);
    try {
      const { title, description, location, date, category, isFavorite } = req.body;
      const file = req.file;
      const userId = req.user?.userId; // Get user ID from JWT token

      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }

      if (!file?.path) {
        return sendError(res, 400, "No image file uploaded");
      }

      const photoData = {
        title,
        description,
        location,
        date: date || new Date(),
        isFavorite: isFavorite === 'true' || isFavorite === true,
        category: category || 'General',
        imageUrl: file.path.replace(/^public[\\/]/, ''), // Store relative path
        userId: userId
      };

      const result = await photoModel.savePhoto(photoData);

      if (!result.success) {
        return sendError(res, 500, "Failed to save photo to database", result.error);
      }

      return sendSuccess(res, 201, "Photo uploaded successfully", { id: result.id, imageUrl: photoData.imageUrl });
    } catch (error) {
      console.error("UploadPhoto error:", error);
      return sendError(res, 500, "Server error", error);
    }
  },

  // Get all photos for a specific user
  async getAllPhotos(req, res) {
    try {
      const currentUserId = req.user?.userId;
      if (!currentUserId) {
        return sendError(res, 401, "Authentication required to view photos");
      }
      const result = await photoModel.getPhotosByUserId(currentUserId);
      if (!result.success) {
        return sendError(res, 500, result.message);
      }
      // Only send imageUrl and other fields, not imageBase64
      return sendSuccess(res, 200, null, result.data);
    } catch (error) {
      console.error("Get photos error:", error);
      return sendError(res, 500, "Server error", error);
    }
  },

  // Get photo by ID
  async getPhotoById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }
      const result = await photoModel.getPhotoById(id, userId);
      if (!result.success) {
        return sendError(res, 404, result.message);
      }
      // Only send imageUrl and other fields, not imageBase64
      return sendSuccess(res, 200, null, result.data);
    } catch (error) {
      console.error("Get photo by ID error:", error);
      return sendError(res, 500, "Server error", error);
    }
  },

  // Toggle favorite status
  async toggleFavorite(req, res) {
    try {
      const { id } = req.params;
      const { isFavorite } = req.body;
      const userId = req.user?.userId;
      
      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }
      
      const result = await photoModel.updateFavoriteStatus(id, isFavorite, userId);
      
      if (!result.success) {
        return sendError(res, 500, result.message);
      }

      return sendSuccess(res, 200, "Favorite status updated successfully");
    } catch (error) {
      console.error("Toggle favorite error:", error);
      return sendError(res, 500, "Server error", error);
    }
  },

  // Update photo metadata and optionally image
  async updatePhoto(req, res) {
    try {
      const { id } = req.params;
      const { title, description, location, date, category, isFavorite } = req.body;
      const file = req.file;
      const userId = req.user?.userId;
      
      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }
      
      if (!title?.trim()) {
        return sendError(res, 400, "Title is required");
      }

      const photoData = {
        title: title.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        date: date || new Date(),
        category: category || 'General',
        isFavorite: isFavorite === true || isFavorite === 'true'
      };

      if (file?.path) {
        photoData.imageUrl = file.path.replace(/^public[\\/]/, '');
      }

      const result = await photoModel.updatePhoto(id, photoData, userId);
      
      if (!result.success) {
        return sendError(res, 500, result.message);
      }

      return sendSuccess(res, 200, "Photo updated successfully", photoData);
    } catch (error) {
      return sendError(res, 500, "Server error", error);
    }
  },

  // Delete photo
  async deletePhoto(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }
      
      const result = await photoModel.deletePhoto(id, userId);
      
      if (!result.success) {
        return sendError(res, 500, result.message);
      }

      return sendSuccess(res, 200, "Photo deleted successfully");
    } catch (error) {
      console.error("Delete photo error:", error);
      return sendError(res, 500, "Server error", error);
    }
  }
};

module.exports = photoController;