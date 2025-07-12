// Main Weather App Initialization and Module Loader
// This file loads all required modules and initializes the weather application

// Weather API Configuration - Now pulls from environment
const WEATHER_CONFIG = {
    apiKey: getWeatherApiKey(),
    baseURL: 'https://api.weatherapi.com/v1',
    endpoints: {
        forecast: '/forecast.json',
        current: '/current.json',
        search: '/search.json'
    },
    defaultLocation: 'Singapore'
};

/**
 * Get Weather API key from environment
 * @returns {string} Weather API key
 */
function getWeatherApiKey() {
    // For Node.js server environment - try to get from server's /api/env endpoint
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // This will be handled asynchronously in the actual weather fetch
        return 'b4389571ae284ebc84d83842250607'; // Fallback for immediate use
    }
    
    // Check for browser environment with exposed env vars (Live Server)
    if (typeof window !== 'undefined' && window.ENV) {
        const apiKey = window.ENV.WEATHER_API_KEY;
        if (!apiKey) {
            console.error('❌ WEATHER_API_KEY not found in window.ENV');
            throw new Error('Weather API key not configured.');
        }
        return apiKey;
    }
    
    // Fallback for development
    console.warn('Using fallback Weather API key. Please configure environment variables.');
    return 'b4389571ae284ebc84d83842250607'; // Temporary fallback
}

class WeatherAppLoader {
    constructor() {
        this.loadedModules = new Set();
        this.weatherController = null;
        this.weatherModel = null;
        this.weatherValidator = null;
        this.config = WEATHER_CONFIG;
    }

    /**
     * Load a JavaScript file dynamically
     * @param {string} src - Source path of the JavaScript file
     * @returns {Promise} Promise that resolves when script is loaded
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (this.loadedModules.has(src)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                this.loadedModules.add(src);
                console.log(`✅ Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Load all required modules in dependency order
     */
    async loadAllModules() {
        try {
            console.log('🚀 Loading Weather App modules...');

            // Use absolute paths that work with Express static middleware
            const modules = [
                '/middlewares/weatherValidation.js',
                '/models/weatherModel.js',
                '/controllers/weatherController.js'
            ];

            // Load each module sequentially to maintain dependency order
            for (const module of modules) {
                await this.loadScript(module);
            }

            console.log('✅ All Weather App modules loaded successfully!');
            return true;

        } catch (error) {
            console.error('❌ Failed to load modules:', error);
            this.showError('Failed to load weather application modules. Please refresh the page.');
            return false;
        }
    }

    /**
     * Initialize the weather application using loaded modules
     */
    async initializeApp() {
        try {
            // Wait a bit to ensure all modules are properly loaded
            await new Promise(resolve => setTimeout(resolve, 200));

            // Check if required classes exist
            if (typeof WeatherController === 'undefined') {
                throw new Error('WeatherController not loaded');
            }

            if (typeof WeatherModel === 'undefined') {
                throw new Error('WeatherModel not loaded');
            }

            if (typeof WeatherValidator === 'undefined') {
                console.warn('WeatherValidator not loaded - using fallback validation');
            }

            // Initialize the weather controller (which will create its own model instance)
            this.weatherController = new WeatherController();
            window.weatherController = this.weatherController;

            // Pass API configuration to the controller/model
            if (this.weatherController.model) {
                this.weatherController.model.apiKey = this.config.apiKey;
                this.weatherController.model.apiEndpoints = this.config.endpoints;
            }

            // Set up global weather configuration
            window.WEATHER_CONFIG = this.config;

            // Initialize the app with default location
            await this.weatherController.init(this.config.defaultLocation);

            console.log('🌟 Weather App initialized successfully!');

        } catch (error) {
            console.error('❌ Failed to initialize weather app:', error);
            
            // Try to reinitialize after a delay
            setTimeout(async () => {
                try {
                    console.log('🔄 Attempting to reinitialize...');
                    this.weatherController = new WeatherController();
                    window.weatherController = this.weatherController;
                    
                    // Set API key again on retry
                    if (this.weatherController.model) {
                        this.weatherController.model.apiKey = this.config.apiKey;
                    }
                    
                    await this.weatherController.init(this.config.defaultLocation);
                    console.log('🔄 Weather App initialized on retry!');
                } catch (retryError) {
                    console.error('❌ Retry failed:', retryError);
                    this.showError('Weather application failed to start. Please refresh the page.');
                }
            }, 1500);
        }
    }

    /**
     * Show error message to user
     * @param {string} message - Error message to display
     */
    showError(message) {
        // Create a simple error overlay
        const errorDiv = document.createElement('div');
        errorDiv.className = 'app-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h3>Application Error</h3>
                <p>${message}</p>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
        
        // Add error styling
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-family: Arial, sans-serif;
        `;

        const errorContent = errorDiv.querySelector('.error-content');
        errorContent.style.cssText = `
            background: #dc3545;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        const button = errorContent.querySelector('button');
        button.style.cssText = `
            background: white;
            color: #dc3545;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 5px;
            margin-top: 1rem;
            cursor: pointer;
            font-weight: bold;
            font-size: 1rem;
        `;

        document.body.appendChild(errorDiv);
    }

    /**
     * Start the application loading process
     */
    async start() {
        const modulesLoaded = await this.loadAllModules();
        if (modulesLoaded) {
            await this.initializeApp();
        }
    }
}

// Enhanced WeatherApp class that uses the loaded modules
class WeatherApp {
    constructor() {
        this.controller = null;
        this.model = null;
        this.validator = null;
        this.config = WEATHER_CONFIG;
    }

    /**
     * Initialize the weather app with loaded modules
     */
    async init() {
        try {
            // Wait for modules to be available
            let attempts = 0;
            const maxAttempts = 10;
            
            while (attempts < maxAttempts) {
                if (typeof WeatherController !== 'undefined' && 
                    typeof WeatherModel !== 'undefined') {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (attempts >= maxAttempts) {
                throw new Error('Modules failed to load within timeout');
            }

            // Initialize controller (it will create its own model instance)
            this.controller = new WeatherController();
            
            // Get reference to the model from controller
            this.model = this.controller.model;
            
            // Configure API settings
            if (this.model) {
                this.model.apiKey = this.config.apiKey;
                this.model.apiEndpoints = this.config.endpoints;
            }
            
            // Set up global references
            window.weatherController = this.controller;
            window.weatherModel = this.model;
            window.weatherConfig = this.config;

            // Initialize with default location
            await this.controller.init(this.config.defaultLocation);

            console.log('🌈 Weather App fully initialized!');
            
        } catch (error) {
            console.error('Weather App initialization error:', error);
            throw error;
        }
    }

    /**
     * Get weather data using the loaded model
     * @param {string} location - Location to search
     */
    async getWeatherData(location) {
        if (!this.model) {
            throw new Error('Weather model not initialized');
        }
        return await this.model.fetchWeatherData(location);
    }

    /**
     * Update weather display using the loaded controller
     * @param {Object} data - Weather data
     */
    async updateDisplay(data) {
        if (!this.controller) {
            throw new Error('Weather controller not initialized');
        }
        await this.controller.updateWeatherDisplay(data);
    }

    /**
     * Validate API key configuration
     */
    validateConfiguration() {
        if (!this.config.apiKey || this.config.apiKey.length < 10) {
            throw new Error('Invalid Weather API key configuration');
        }
        return true;
    }
}

// Global utility functions for weather app
window.WeatherUtils = {
    /**
     * Format temperature
     * @param {number} temp - Temperature in Celsius
     * @returns {string} Formatted temperature
     */
    formatTemperature(temp) {
        return `${Math.round(temp)}°C`;
    },

    /**
     * Format date for weather display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatWeatherDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Get weather icon based on condition
     * @param {string} condition - Weather condition text
     * @returns {string} Weather emoji
     */
    getWeatherIcon(condition) {
        const conditionLower = condition.toLowerCase();
        
        if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
            return '☀️';
        }
        if (conditionLower.includes('rain')) {
            return '🌧️';
        }
        if (conditionLower.includes('cloud')) {
            return '☁️';
        }
        if (conditionLower.includes('storm')) {
            return '⛈️';
        }
        return '🌤️';
    }
};

// Global functions for backward compatibility with existing HTML
window.searchWeather = function(defaultLocation = "") {
    try {
        if (window.weatherController) {
            window.weatherController.searchWeather(defaultLocation);
        } else {
            console.error('Weather controller not available');
            // Try to initialize if not available
            setTimeout(() => {
                if (window.weatherController) {
                    window.weatherController.searchWeather(defaultLocation);
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Search weather error:', error);
    }
};

window.getWeatherData = async function(location) {
    try {
        if (window.weatherModel) {
            return await window.weatherModel.fetchWeatherData(location);
        } else {
            console.error('Weather model not available');
            return { success: false, error: 'Weather model not available' };
        }
    } catch (error) {
        console.error('Get weather data error:', error);
        return { success: false, error: error.message };
    }
};

// Enhanced error handling for the application
window.addEventListener('error', function(e) {
    console.error('Weather App Error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🌦️ Starting Weather Application...');
    
    try {
        const loader = new WeatherAppLoader();
        await loader.start();
    } catch (error) {
        console.error('Failed to start weather app:', error);
    }
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    // DOMContentLoaded has not fired yet, event listener above will handle it
} else {
    // DOM is already ready, initialize immediately
    setTimeout(async () => {
        console.log('🌦️ Starting Weather Application (fallback)...');
        try {
            const loader = new WeatherAppLoader();
            await loader.start();
        } catch (error) {
            console.error('Fallback initialization failed:', error);
        }
    }, 100);
}

// Additional fallback to ensure weather app is running
window.addEventListener('load', function() {
    setTimeout(() => {
        if (!window.weatherController) {
            console.log('🔧 Final fallback initialization...');
            const loader = new WeatherAppLoader();
            loader.start().catch(console.error);
        }
    }, 500);
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WeatherAppLoader, WeatherApp, WEATHER_CONFIG };
}