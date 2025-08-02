const WeatherValidator = {
  validateLocation(location) {
    try {
      if (!location || typeof location !== 'string') return false;
      const trimmedLocation = location.trim();
      if (trimmedLocation.length < 2 || trimmedLocation.length > 100) return false;
      const validLocationPattern = /^[a-zA-Z0-9\s\-',\.]+$/;
      if (!validLocationPattern.test(trimmedLocation)) return false;
      const sqlInjectionPattern = /(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|CREATE|ALTER|EXEC|SCRIPT)/i;
      if (sqlInjectionPattern.test(trimmedLocation)) return false;
      return true;
    } catch (error) {
      console.error('validateLocation error:', error);
      return false;
    }
  }
};

// Express middleware for validating location query param
function validateLocationMiddleware(req, res, next) {
  try {
    const location = req.query.location || req.query.q;
    
    if (!location) {
      return res.status(400).json({ 
        success: false, 
        message: "Location parameter is required" 
      });
    }
    
    if (!WeatherValidator.validateLocation(location)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid location parameter. Please provide a valid location name." 
      });
    }
    
    next();
  } catch (error) {
    console.error('validateLocationMiddleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Validation processing error",
      error: error.message 
    });
  }
}

module.exports = {
  validateLocationMiddleware,
  WeatherValidator
};