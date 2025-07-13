const sql = require("mssql");
const dbConfig = require("../dbConfig");
const photoModel = require("../models/photoModel");
const fetch = require("node-fetch");
const imgbbKey = process.env.IMGBB_API_KEY;

const photoController = {
  // Upload a new photo
  async uploadPhoto(req, res) {
    try {
      const { title, description, location, date, category, isFavorite, userId } = req.body;
      const file = req.file;

      // Upload to imgbb
      const formData = new URLSearchParams();
      formData.append("image", file.buffer.toString("base64"));

      const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: "POST",
        body: formData,
      });

      const imgbbResult = await imgbbResponse.json();

      if (!imgbbResult.success) {
        return res.status(500).json({ 
          success: false, 
          message: "Image upload failed", 
          error: imgbbResult.error?.message || "Unknown error" 
        });
      }

      const imageUrl = imgbbResult.data.url;

      // Prepare photo data
      const photoData = {
        title,
        description,
        location,
        date: date || new Date(),
        isFavorite: isFavorite === 'true' || isFavorite === true || false,
        category: category || 'General',
        imageUrl,
        userId: parseInt(userId) || 1 // Parse userId from form data or default to 1
      };

      // Save to database using model
      const result = await photoModel.savePhoto(photoData);

      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to save photo to database",
          error: result.error 
        });
      }

      return res.status(201).json({
        success: true,
        message: "Photo uploaded and stored successfully",
        data: {
          title,
          description,
          location,
          date: photoData.date,
          category: photoData.category,
          isFavorite: photoData.isFavorite,
          url: imageUrl,
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // Get all photos for a specific user
  async getAllPhotos(req, res) {
    try {
      const { userId } = req.query; // Get userId from query parameters
      
      let result;
      if (userId) {
        result = await photoModel.getPhotosByUserId(userId);
      } else {
        result = await photoModel.getAllPhotos();
      }
      
      if (!result.success) {
        return res.status(500).json({ success: false, message: result.message });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error("Get photos error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // Get photo by ID
  async getPhotoById(req, res) {
    try {
      const { id } = req.params;
      const result = await photoModel.getPhotoById(id);
      
      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error("Get photo by ID error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // Toggle favorite status
  async toggleFavorite(req, res) {
    try {
      const { id } = req.params;
      const { isFavorite } = req.body;
      
      const result = await photoModel.updateFavoriteStatus(id, isFavorite);
      
      if (!result.success) {
        return res.status(500).json({ success: false, message: result.message });
      }

      return res.status(200).json({
        success: true,
        message: "Favorite status updated successfully"
      });
    } catch (error) {
      console.error("Toggle favorite error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // Update photo metadata and optionally image
  async updatePhoto(req, res) {
    try {
      const { id } = req.params;
      const { title, description, location, date, category, isFavorite } = req.body;
      const file = req.file; // New image file if provided
      
      // Validate required fields
      if (!title || title.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: "Title is required" 
        });
      }

      let imageUrl = null;

      // Upload new image to imgbb if provided
      if (file) {
        const formData = new URLSearchParams();
        formData.append("image", file.buffer.toString("base64"));

        const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: "POST",
          body: formData,
        });

        const imgbbResult = await imgbbResponse.json();

        if (!imgbbResult.success) {
          return res.status(500).json({ 
            success: false, 
            message: "Image upload failed", 
            error: imgbbResult.error?.message || "Unknown error" 
          });
        }

        imageUrl = imgbbResult.data.url;
      }

      const photoData = {
        title: title.trim(),
        description: description ? description.trim() : null,
        location: location ? location.trim() : null,
        date: date || new Date(),
        category: category || 'General',
        isFavorite: isFavorite === true || isFavorite === 'true'
      };

      // Add imageUrl to update data if a new image was uploaded
      if (imageUrl) {
        photoData.imageUrl = imageUrl;
      }

      const result = await photoModel.updatePhoto(id, photoData);
      
      if (!result.success) {
        return res.status(500).json({ success: false, message: result.message });
      }

      // Include the new imageUrl in response if updated
      const responseData = { ...photoData };
      if (imageUrl) {
        responseData.imageUrl = imageUrl;
      }

      return res.status(200).json({
        success: true,
        message: "Photo updated successfully",
        data: responseData
      });
    } catch (error) {
      console.error("Update photo error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // Delete photo
  async deletePhoto(req, res) {
    try {
      const { id } = req.params;
      const result = await photoModel.deletePhoto(id);
      
      if (!result.success) {
        return res.status(500).json({ success: false, message: result.message });
      }

      return res.status(200).json({
        success: true,
        message: "Photo deleted successfully"
      });
    } catch (error) {
      console.error("Delete photo error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  }
};

module.exports = photoController;