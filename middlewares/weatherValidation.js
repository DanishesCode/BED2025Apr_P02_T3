const WeatherValidator = {
  validateLocation(location) {
    if (!location || typeof location !== 'string') return false;
    const trimmedLocation = location.trim();
    if (trimmedLocation.length < 2 || trimmedLocation.length > 100) return false;
    const validLocationPattern = /^[a-zA-Z0-9\s\-',\.]+$/;
    if (!validLocationPattern.test(trimmedLocation)) return false;
    const sqlInjectionPattern = /(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|CREATE|ALTER|EXEC|SCRIPT)/i;
    if (sqlInjectionPattern.test(trimmedLocation)) return false;
    return true;
  }
};

// Express middleware for validating location query param
function validateLocationMiddleware(req, res, next) {
  const location = req.query.location || req.query.q;
  if (!WeatherValidator.validateLocation(location)) {
    return res.status(400).json({ success: false, error: 'Invalid location parameter' });
  }
  next();
}

module.exports = WeatherValidator;
module.exports.validateLocationMiddleware = validateLocationMiddleware;