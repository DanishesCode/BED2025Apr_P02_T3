// Weather Validation - Handles input validation and data sanitization

class WeatherValidator {
    /**
     * Validate location input
     * @param {string} location - Location string to validate
     * @returns {boolean} True if valid, false otherwise
     */
    static validateLocation(location) {
        // Check if location is provided and not empty
        if (!location || typeof location !== 'string') {
            return false;
        }

        // Trim and check if still has content
        const trimmedLocation = location.trim();
        if (trimmedLocation.length === 0) {
            return false;
        }

        // Check minimum length (at least 2 characters)
        if (trimmedLocation.length < 2) {
            return false;
        }

        // Check maximum length (reasonable limit)
        if (trimmedLocation.length > 100) {
            return false;
        }

        // Check for valid characters (letters, numbers, spaces, hyphens, apostrophes, commas)
        const validLocationPattern = /^[a-zA-Z0-9\s\-',\.]+$/;
        if (!validLocationPattern.test(trimmedLocation)) {
            return false;
        }

        // Check for SQL injection patterns (basic protection)
        const sqlInjectionPattern = /(DROP|DELETE|INSERT|UPDATE|SELECT|UNION|CREATE|ALTER|EXEC|SCRIPT)/i;
        if (sqlInjectionPattern.test(trimmedLocation)) {
            return false;
        }

        return true;
    }

    /**
     * Sanitize location input
     * @param {string} location - Location string to sanitize
     * @returns {string} Sanitized location string
     */
    static sanitizeLocation(location) {
        if (!location || typeof location !== 'string') {
            return '';
        }

        // Trim whitespace
        let sanitized = location.trim();

        // Remove multiple consecutive spaces
        sanitized = sanitized.replace(/\s+/g, ' ');

        // Remove special characters except allowed ones
        sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-',\.]/g, '');

        // Limit length
        if (sanitized.length > 100) {
            sanitized = sanitized.substring(0, 100);
        }

        return sanitized;
    }

    /**
     * Validate weather API response
     * @param {Object} response - API response object
     * @returns {boolean} True if valid response, false otherwise
     */
    static validateWeatherResponse(response) {
        if (!response || typeof response !== 'object') {
            return false;
        }

        // Check for required location data
        if (!response.location || 
            !response.location.name || 
            !response.location.country) {
            return false;
        }

        // Check for required current weather data
        if (!response.current || 
            typeof response.current.temp_c !== 'number' ||
            !response.current.condition ||
            !response.current.condition.text) {
            return false;
        }

        return true;
    }

    /**
     * Validate temperature value
     * @param {number} temp - Temperature value
     * @returns {boolean} True if valid temperature, false otherwise
     */
    static validateTemperature(temp) {
        if (typeof temp !== 'number' || isNaN(temp)) {
            return false;
        }

        // Check for reasonable temperature range (-100°C to 70°C)
        if (temp < -100 || temp > 70) {
            return false;
        }

        return true;
    }

    /**
     * Validate humidity value
     * @param {number} humidity - Humidity percentage
     * @returns {boolean} True if valid humidity, false otherwise
     */
    static validateHumidity(humidity) {
        if (typeof humidity !== 'number' || isNaN(humidity)) {
            return false;
        }

        // Humidity should be between 0 and 100
        if (humidity < 0 || humidity > 100) {
            return false;
        }

        return true;
    }

    /**
     * Validate UV index value
     * @param {number} uvIndex - UV index value
     * @returns {boolean} True if valid UV index, false otherwise
     */
    static validateUVIndex(uvIndex) {
        if (typeof uvIndex !== 'number' || isNaN(uvIndex)) {
            return false;
        }

        // UV index typically ranges from 0 to 15+
        if (uvIndex < 0 || uvIndex > 20) {
            return false;
        }

        return true;
    }

    /**
     * Validate visibility value
     * @param {number} visibility - Visibility in km
     * @returns {boolean} True if valid visibility, false otherwise
     */
    static validateVisibility(visibility) {
        if (typeof visibility !== 'number' || isNaN(visibility)) {
            return false;
        }

        // Visibility should be positive and reasonable (0 to 50km)
        if (visibility < 0 || visibility > 50) {
            return false;
        }

        return true;
    }

    /**
     * Validate image URL
     * @param {string} imageUrl - Image URL to validate
     * @returns {boolean} True if valid URL, false otherwise
     */
    static validateImageUrl(imageUrl) {
        if (!imageUrl || typeof imageUrl !== 'string') {
            return false;
        }

        try {
            const url = new URL(imageUrl);
            
            // Check for HTTPS protocol for security
            if (url.protocol !== 'https:') {
                return false;
            }

            // Check for valid image extensions
            const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            const hasValidExtension = validExtensions.some(ext => 
                url.pathname.toLowerCase().includes(ext)
            );

            // Allow URLs without extensions (like Picsum or API endpoints)
            const isApiEndpoint = url.hostname.includes('picsum') || 
                                 url.hostname.includes('pixabay') || 
                                 url.hostname.includes('unsplash');

            return hasValidExtension || isApiEndpoint;

        } catch (error) {
            return false;
        }
    }

    /**
     * Sanitize and validate complete weather data object
     * @param {Object} weatherData - Weather data object to validate
     * @returns {Object} Sanitized and validated weather data
     */
    static sanitizeWeatherData(weatherData) {
        const sanitized = {
            location: {
                name: '',
                country: ''
            },
            current: {
                temp_c: 0,
                condition: '',
                humidity: 0,
                feelslike_c: 0,
                uv: 0,
                vis_km: 0
            }
        };

        if (weatherData && weatherData.location) {
            sanitized.location.name = this.sanitizeLocation(weatherData.location.name || '');
            sanitized.location.country = this.sanitizeLocation(weatherData.location.country || '');
        }

        if (weatherData && weatherData.current) {
            const current = weatherData.current;
            
            sanitized.current.temp_c = this.validateTemperature(current.temp_c) ? 
                Math.round(current.temp_c) : 0;
            
            sanitized.current.condition = (current.condition && current.condition.text) ? 
                String(current.condition.text).trim() : 'Unknown';
            
            sanitized.current.humidity = this.validateHumidity(current.humidity) ? 
                current.humidity : 0;
            
            sanitized.current.feelslike_c = this.validateTemperature(current.feelslike_c) ? 
                Math.round(current.feelslike_c) : 0;
            
            sanitized.current.uv = this.validateUVIndex(current.uv) ? 
                current.uv : 0;
            
            sanitized.current.vis_km = this.validateVisibility(current.vis_km) ? 
                current.vis_km : 0;
        }

        return sanitized;
    }
}
