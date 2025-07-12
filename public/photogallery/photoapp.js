const express = require("express");
const sql = require("mssql");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const dbConfig = require("./photoConfig");
const validatePhoto = require("../../middlewares/PhotoValidation"); // Correct path to middleware
const photoController = require("../../controllers/photoController"); // Correct path to controller

const app = express();
const port = process.env.PORT || 3001; // Different port to avoid conflicts

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the photogallery directory
app.use(express.static(__dirname));

// Multer setup for file uploads
const upload = multer();

// Routes for HTML pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'photo.html'));
});

app.get("/upload", (req, res) => {
    res.sendFile(path.join(__dirname, 'photoupload.html'));
});

// --- Photo API Routes ---
// GET all photos
app.get("/photos", photoController.getAllPhotos);

// GET photo by ID
app.get("/photos/:id", photoController.getPhotoById);

// POST upload new photo with validation middleware
app.post("/photos/upload", (req, res, next) => {
    console.log("=== UPLOAD REQUEST RECEIVED ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("Headers:", req.headers);
    next();
}, upload.single("photo"), validatePhoto, photoController.uploadPhoto);

// PUT toggle favorite status
app.put("/photos/:id/favorite", photoController.toggleFavorite);

// PUT update photo metadata and optionally image
app.put("/photos/:id", upload.single("photo"), photoController.updatePhoto);

// DELETE photo by ID
app.delete("/photos/:id", photoController.deletePhoto);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error("=== SERVER ERROR ===");
    console.error(error);
    res.status(500).json({ 
        success: false, 
        message: "Server error", 
        error: error.message 
    });
});

app.listen(port, async () => {
  try {
    await sql.connect(dbConfig);
    console.log("Database connected");
  } catch (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
  console.log(`Server running on port ${port}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await sql.close();
  process.exit(0);
});

module.exports = app;