const sql = require("mssql");
const dbConfig = require("../dbConfig");

const photoModel = {
  // Save a new photo to database
  async savePhoto(metadata) {
    try {
      let pool = await sql.connect(dbConfig);
      const query = `
        INSERT INTO Photos (title, description, location, date, isFavorite, category, imageUrl, uploadedAt, userId)
        OUTPUT INSERTED.id
        VALUES (@title, @description, @location, @date, @isFavorite, @category, @imageUrl, GETDATE(), @userId)
      `;
      
      const result = await pool.request()
        .input("title", sql.NVarChar(100), metadata.title)
        .input("description", sql.NVarChar(500), metadata.description || null)
        .input("location", sql.NVarChar(100), metadata.location || null)
        .input("date", sql.Date, metadata.date || new Date())
        .input("isFavorite", sql.Bit, metadata.isFavorite || false)
        .input("category", sql.NVarChar(50), metadata.category || 'General')
        .input("imageUrl", sql.NVarChar(sql.MAX), metadata.imageUrl)
        .input("userId", sql.Int, metadata.userId || 1) // Pass userId through metadata
        .query(query);

      return { 
        success: true, 
        message: "Photo metadata saved to DB", 
        data: { id: result.recordset[0].id }
      };
    } catch (err) {
      console.error("Model: DB Error", err);
      return { success: false, message: "DB Error", error: err.message };
    }
  },

  // Get all photos from database
  async getAllPhotos() {
    try {
      let pool = await sql.connect(dbConfig);
      const result = await pool.request().query('SELECT * FROM Photos ORDER BY uploadedAt DESC');
      return { success: true, data: result.recordset };
    } catch (err) {
      console.error("Model: Get Photos Error", err);
      return { success: false, message: "Failed to fetch photos", error: err.message };
    }
  },

  // Get photo by ID
  async getPhotoById(id) {
    try {
      let pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Photos WHERE id = @id');
      
      if (result.recordset.length === 0) {
        return { success: false, message: "Photo not found" };
      }
      
      return { success: true, data: result.recordset[0] };
    } catch (err) {
      console.error("Model: Get Photo By ID Error", err);
      return { success: false, message: "Failed to fetch photo", error: err.message };
    }
  },

  // Update favorite status
  async updateFavoriteStatus(id, isFavorite) {
    try {
      let pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('isFavorite', sql.Bit, isFavorite)
        .query('UPDATE Photos SET isFavorite = @isFavorite WHERE id = @id');
      
      if (result.rowsAffected[0] === 0) {
        return { success: false, message: "Photo not found" };
      }
      
      return { success: true, message: "Favorite status updated" };
    } catch (err) {
      console.error("Model: Update Favorite Error", err);
      return { success: false, message: "Failed to update favorite status", error: err.message };
    }
  },

  // Update photo metadata and optionally image
  async updatePhoto(id, photoData) {
    try {
      let pool = await sql.connect(dbConfig);
      
      // Build dynamic query based on whether imageUrl is provided
      let query = `
        UPDATE Photos 
        SET title = @title, 
            description = @description, 
            location = @location, 
            date = @date, 
            category = @category, 
            isFavorite = @isFavorite
      `;
      
      // Add imageUrl to query if provided
      if (photoData.imageUrl) {
        query += `, imageUrl = @imageUrl`;
      }
      
      query += ` WHERE id = @id`;
      
      const request = pool.request()
        .input('id', sql.Int, id)
        .input('title', sql.NVarChar(100), photoData.title)
        .input('description', sql.NVarChar(500), photoData.description)
        .input('location', sql.NVarChar(100), photoData.location)
        .input('date', sql.Date, photoData.date)
        .input('category', sql.NVarChar(50), photoData.category)
        .input('isFavorite', sql.Bit, photoData.isFavorite);
      
      // Add imageUrl parameter if provided
      if (photoData.imageUrl) {
        request.input('imageUrl', sql.NVarChar(sql.MAX), photoData.imageUrl);
      }
      
      const result = await request.query(query);
      
      if (result.rowsAffected[0] === 0) {
        return { success: false, message: "Photo not found" };
      }
      
      return { success: true, message: "Photo updated successfully" };
    } catch (err) {
      console.error("Model: Update Photo Error", err);
      return { success: false, message: "Failed to update photo", error: err.message };
    }
  },

  // Delete photo
  async deletePhoto(id) {
    try {
      let pool = await sql.connect(dbConfig);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Photos WHERE id = @id');
      
      if (result.rowsAffected[0] === 0) {
        return { success: false, message: "Photo not found" };
      }
      
      return { success: true, message: "Photo deleted successfully" };
    } catch (err) {
      console.error("Model: Delete Photo Error", err);
      return { success: false, message: "Failed to delete photo", error: err.message };
    }
  }
};

module.exports = photoModel;