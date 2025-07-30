// Custom validation error class
class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

const validatePhoto = (req, res, next) => {
  try {
    const { title, description, location } = req.body;
    const file = req.file;
    const errors = [];

    // Validate title (required)
    if (!title || title.trim().length === 0) {
      errors.push("Title is required");
    }

    if (title && title.length > 100) {
      errors.push("Title must not exceed 100 characters");
    }

    // Validate description (optional)
    if (description && description.length > 500) {
      errors.push("Description must not exceed 500 characters");
    }

    // Validate location (optional)
    if (location && location.length > 100) {
      errors.push("Location must not exceed 100 characters");
    }

    // Validate file (required)
    if (!file) {
      errors.push("Photo file is required");
    } else {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.mimetype)) {
        errors.push("Invalid file type. Allowed: JPEG, PNG, JPG, GIF");
      }

      if (file.size > maxSize) {
        errors.push("File size exceeds limit (5MB)");
      }
    }

    // If validation fails, return error
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed",
        errors: errors 
      });
    }

    // If validation passes, proceed to next middleware/controller
    next();
  } catch (error) {
    console.error("Photo validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Validation processing error",
      error: error.message
    });
  }
};

module.exports = validatePhoto;