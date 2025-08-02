const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Save photo to database
async function savePhoto(photoData) {
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('title', sql.NVarChar(100), photoData.title);
    request.input('description', sql.NVarChar(500), photoData.description);
    request.input('location', sql.NVarChar(100), photoData.location);
    request.input('date', sql.Date, photoData.date);
    request.input('category', sql.NVarChar(50), photoData.category);
    request.input('isFavorite', sql.Bit, photoData.isFavorite);
    request.input('userId', sql.Int, photoData.userId);
    request.input('imageUrl', sql.NVarChar(sql.MAX), photoData.imageUrl);
    const result = await request.query(`
      INSERT INTO Photos (title, description, location, date, category, isFavorite, imageUrl, userId)
      VALUES (@title, @description, @location, @date, @category, @isFavorite, @imageUrl, @userId);
      SELECT SCOPE_IDENTITY() AS id;
    `);
    return { success: true, id: result.recordset[0].id };
  } catch (error) {
    console.error("savePhoto error:", error);
    return { success: false, error: error.message };
  }
}

// Get all photos for a user
async function getPhotosByUserId(userId) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Photos WHERE userId = @userId ORDER BY uploadedAt DESC');
    return { success: true, data: result.recordset };
  } catch (error) {
    console.error("getPhotosByUserId error:", error);
    return { success: false, error: error.message };
  }
}

// Get all photos
async function getAllPhotos() {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Photos ORDER BY uploadedAt DESC');
    return { success: true, data: result.recordset };
  } catch (error) {
    console.error("getAllPhotos error:", error);
    return { success: false, error: error.message };
  } finally {
    if (pool) await pool.close();
  }
}

// Get photo by ID
async function getPhotoById(id, userId) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Photos WHERE id = @id AND userId = @userId');
    if (result.recordset.length === 0) {
      return { success: false, message: 'Photo not found or access denied' };
    }
    return { success: true, data: result.recordset[0] };
  } catch (error) {
    console.error("getPhotoById error:", error);
    return { success: false, error: error.message };
  }
}

// Update photo in database
async function updatePhoto(id, photoData, userId) {
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('id', sql.Int, id);
    request.input('userId', sql.Int, userId);
    request.input('title', sql.NVarChar(100), photoData.title);
    request.input('description', sql.NVarChar(500), photoData.description);
    request.input('location', sql.NVarChar(100), photoData.location);
    request.input('date', sql.Date, photoData.date);
    request.input('category', sql.NVarChar(50), photoData.category);
    request.input('isFavorite', sql.Bit, photoData.isFavorite);
    let updateQuery = `UPDATE Photos SET title=@title, description=@description, location=@location, date=@date, category=@category, isFavorite=@isFavorite`;
    if (photoData.imageUrl) {
      request.input('imageUrl', sql.NVarChar(sql.MAX), photoData.imageUrl);
      updateQuery += `, imageUrl=@imageUrl`;
    }
    updateQuery += ` WHERE id=@id AND userId=@userId`;
    await request.query(updateQuery);
    return { success: true };
  } catch (error) {
    console.error("updatePhoto error:", error);
    return { success: false, error: error.message };
  }
}

// Delete photo
async function deletePhoto(id, userId) {
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('id', sql.Int, id);
    request.input('userId', sql.Int, userId);
    
    // First check if the photo belongs to the user
    const checkResult = await request.query(`
      SELECT id FROM Photos WHERE id = @id AND userId = @userId
    `);
    
    if (checkResult.recordset.length === 0) {
      return { success: false, message: 'Photo not found or access denied' };
    }
    
    await request.query('DELETE FROM Photos WHERE id = @id AND userId = @userId');
    return { success: true };
  } catch (error) {
    console.error("deletePhoto error:", error);
    return { success: false, error: error.message };
  }
}

// Update favorite status
async function updateFavoriteStatus(id, isFavorite, userId) {
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('id', sql.Int, id);
    request.input('userId', sql.Int, userId);
    request.input('isFavorite', sql.Bit, isFavorite);
    
    // First check if the photo belongs to the user
    const checkResult = await request.query(`
      SELECT id FROM Photos WHERE id = @id AND userId = @userId
    `);
    
    if (checkResult.recordset.length === 0) {
      return { success: false, message: 'Photo not found or access denied' };
    }
    
    await request.query('UPDATE Photos SET isFavorite = @isFavorite WHERE id = @id AND userId = @userId');
    return { success: true };
  } catch (error) {
    console.error("updateFavoriteStatus error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  savePhoto,
  getPhotosByUserId,
  getAllPhotos,
  getPhotoById,
  updatePhoto,
  deletePhoto,
  updateFavoriteStatus
};