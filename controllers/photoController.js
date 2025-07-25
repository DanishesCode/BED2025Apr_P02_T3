const photoModel = require("../models/photoModel");
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

require('dotenv').config();

const imgbbApiKey = process.env.IMGBB_API_KEY;

async function uploadToImgbb(filePath) {
    const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
    const form = new FormData();
    form.append('key', imgbbApiKey);
    form.append('image', imageBase64);

    try {
        const response = await axios.post('https://api.imgbb.com/1/upload', form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        console.log('imgbb response:', response.data); // Log the full response
        return response.data.data.url;
    } catch (err) {
        // Log the full error from imgbb
        if (err.response && err.response.data) {
            console.error('imgbb upload error:', err.response.data);
        } else {
            console.error('imgbb upload error:', err.message);
        }
        throw err;
    }
}

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
      const userId = req.user?.userId;

      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }

      if (!file?.path) {
        return sendError(res, 400, "No image file uploaded");
      }

      console.log("imgbb API key:", imgbbApiKey);
      console.log("Uploading file:", file.path);

      // Upload to imgbb
      const imageUrl = await uploadToImgbb(file.path);

      const photoData = {
        title,
        description,
        location,
        date: date || new Date(),
        isFavorite: isFavorite === 'true' || isFavorite === true,
        category: category || 'General',
        imageUrl: imageUrl,
        userId: userId
      };

      const result = await photoModel.savePhoto(photoData);

      if (!result.success) {
        return sendError(res, 500, "Failed to save photo to database", result.error);
      }

      // Delete the local file after upload, but before sending the response
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to delete local file:', err.message);
        // Do not throw, just log
      }

      console.log('About to send success response');
      return sendSuccess(res, 201, "Photo uploaded successfully", { id: result.id, imageUrl: photoData.imageUrl });
      // Add a log after (should never be reached)
      console.log('This should not print after response');
    } catch (error) {
      // Log the error in detail
      if (error.response && error.response.data) {
        console.error('UploadPhoto error:', error.response.data);
      } else {
        console.error('UploadPhoto error:', error.message || error);
      }
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
        // If an image is being updated, upload it to imgbb and update the imageUrl
        const imageUrl = await uploadToImgbb(file.path);
        photoData.imageUrl = imageUrl;
        // Optionally, delete the local file after upload
        fs.unlinkSync(file.path);
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