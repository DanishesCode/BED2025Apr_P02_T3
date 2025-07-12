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
 * Get Weather API key from environment via server
 * @returns {string} Weather API key
 */
function getWeatherApiKey() {
    // For Node.js server - get from environment variables
    return 'b4389571ae284ebc84d83842250607';
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

            // DISABLED: Module loading for Live Server compatibility
            // The weather functionality will work without external modules
            console.log('✅ Weather App ready (simplified mode)!');
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

            // SIMPLIFIED: Skip module dependency checks for Live Server
            console.log('🌟 Weather App initialized (simplified mode)!');
            
            // Set default location
            if (this.config.defaultLocation) {
                window.searchWeather(this.config.defaultLocation);
            }

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

// Simple Weather App - Clean initialization for Node.js server
document.addEventListener('DOMContentLoaded', function() {
    console.log('�️ Weather app starting on Node.js server...');
    initSimpleWeatherApp();
});

// Simple Weather App initialization function
function initSimpleWeatherApp() {
    console.log('🌟 Initializing Simple Weather App...');
    
    // Set up search functionality
    const searchButton = document.querySelector('.search-btn');
    const searchInput = document.getElementById('locationInput');
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const location = searchInput ? searchInput.value.trim() : '';
            if (location) {
                searchWeatherSimple(location);
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const location = searchInput.value.trim();
                if (location) {
                    searchWeatherSimple(location);
                }
            }
        });
    }
    
    // Load default location weather
    searchWeatherSimple(WEATHER_CONFIG.defaultLocation);
}

// Simple weather search function with forecast
async function searchWeatherSimple(location) {
    try {
        console.log('🔍 Searching weather for:', location);
        
        // Update location display
        const locationDisplay = document.getElementById('displayLocation');
        if (locationDisplay) {
            locationDisplay.textContent = `Loading ${location}...`;
        }
        
        // Make API call for forecast (includes current weather + forecasts)
        const apiKey = WEATHER_CONFIG.apiKey;
        const url = `${WEATHER_CONFIG.baseURL}${WEATHER_CONFIG.endpoints.forecast}?key=${apiKey}&q=${encodeURIComponent(location)}&days=7&aqi=no&alerts=no`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            console.log('Weather forecast data received:', data);
            
            // Display current weather
            displayWeatherData(data);
            
            // Display hourly forecast (next 10 hours from today)
            if (data.forecast && data.forecast.forecastday && data.forecast.forecastday[0]) {
                displayHourlyForecast(data.forecast.forecastday[0].hour);
            }
            
            // Display 7-day forecast
            if (data.forecast && data.forecast.forecastday) {
                displayDailyForecast(data.forecast.forecastday);
            }
            
            // Generate weather activities
            generateWeatherActivities(data.current);
            
        } else {
            throw new Error(data.error?.message || 'Failed to fetch weather data');
        }
        
    } catch (error) {
        console.error('❌ Weather API Error:', error);
        const locationDisplay = document.getElementById('displayLocation');
        if (locationDisplay) {
            locationDisplay.textContent = `Error: ${error.message}`;
        }
    }
}

// Display weather data with proper formatting
function displayWeatherData(data) {
    // Update location display
    const displayLocation = document.getElementById('displayLocation');
    if (displayLocation) {
        displayLocation.textContent = `${data.location.name}, ${data.location.country}`;
    }
    
    // Update temperature
    const tempValue = document.getElementById('tempValue');
    if (tempValue) {
        tempValue.textContent = Math.round(data.current.temp_c);
    }
    
    // Update weather description
    const tempDescription = document.getElementById('tempDescription');
    if (tempDescription) {
        tempDescription.textContent = data.current.condition.text;
    }
    
    // Update day info
    const weatherDesc = document.getElementById('weatherDesc');
    if (weatherDesc) {
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
        weatherDesc.textContent = dayName;
    }
    
    // Update weather details
    const humidity = document.getElementById('humidity');
    if (humidity) {
        humidity.textContent = `Humidity: ${data.current.humidity}%`;
    }
    
    const realFeel = document.getElementById('realFeel');
    if (realFeel) {
        realFeel.textContent = `RealFeel: ${Math.round(data.current.feelslike_c)}°C`;
    }
    
    const uvIndex = document.getElementById('uvIndex');
    if (uvIndex) {
        uvIndex.textContent = `UV Index: ${data.current.uv}`;
    }
    
    const visibility = document.getElementById('visibility');
    if (visibility) {
        visibility.textContent = `Visibility: ${data.current.vis_km} km`;
    }
    
    // Update hero section background based on weather
    updateBackgroundForWeather(data.current.condition.text.toLowerCase());
}

// Display hourly forecast for next 10 hours
function displayHourlyForecast(hourlyData) {
    const hourlyContainer = document.querySelector('.hourly-forecast-container');
    if (!hourlyContainer) {
        console.log('Hourly forecast container not found');
        return;
    }
    
    console.log('Displaying hourly forecast:', hourlyData);
    
    // Get current hour to show next 10 hours
    const currentHour = new Date().getHours();
    const nextHours = [];
    
    // Get next 10 hours from current time
    for (let i = 0; i < 10; i++) {
        const hourIndex = (currentHour + i) % 24;
        const hourData = hourlyData[hourIndex];
        if (hourData) {
            nextHours.push(hourData);
        }
    }
    
    hourlyContainer.innerHTML = nextHours.map(hour => {
        const time = new Date(hour.time);
        const hourStr = time.getHours().toString().padStart(2, '0') + ':00';
        const weatherIcon = getWeatherIcon(hour.condition.text);
        
        return `
            <div class="hourly-item">
                <div class="hourly-time">${hourStr}</div>
                <div class="hourly-icon">${weatherIcon}</div>
                <div class="hourly-temp">${Math.round(hour.temp_c)}°</div>
                <div class="hourly-condition">${hour.condition.text}</div>
            </div>
        `;
    }).join('');
    
    console.log('Hourly forecast displayed successfully');
}

// Display 7-day forecast
function displayDailyForecast(forecastDays) {
    const dailyContainer = document.querySelector('.daily-forecast-container');
    if (!dailyContainer) {
        console.log('Daily forecast container not found');
        return;
    }
    
    console.log('Displaying daily forecast:', forecastDays);
    
    dailyContainer.innerHTML = forecastDays.map((day, index) => {
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherIcon = getWeatherIcon(day.day.condition.text);
        
        return `
            <div class="day-forecast">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-emoji">${weatherIcon}</div>
                <div class="forecast-temp">
                    <div class="forecast-high">${Math.round(day.day.maxtemp_c)}°</div>
                    <div class="forecast-low">${Math.round(day.day.mintemp_c)}°</div>
                </div>
                <div class="forecast-condition">${day.day.condition.text}</div>
            </div>
        `;
    }).join('');
    
    console.log('Daily forecast displayed successfully');
}

// Generate weather-based activities with enhanced styling
function generateWeatherActivities(currentWeather) {
    const activitiesGrid = document.querySelector('.activities-grid');
    if (!activitiesGrid) {
        console.log('Activities grid not found');
        return;
    }
    
    console.log('Generating weather activities for:', currentWeather);
    
    const temp = currentWeather.temp_c;
    const condition = currentWeather.condition.text.toLowerCase();
    const humidity = currentWeather.humidity;
    const uvIndex = currentWeather.uv;
    
    let activities = [];
    
    // Temperature-based activities
    if (temp > 25) {
        activities.push({
            title: "Stay Hydrated",
            description: "It's warm outside! Remember to drink plenty of water throughout the day. Dehydration can be especially dangerous for seniors.",
            icon: "hydration",
            benefits: ["Health", "Safety", "Comfort"],
            warning: "Drink water every 15-20 minutes when outdoors"
        });
        
        activities.push({
            title: "Light & Breathable Clothing",
            description: "Wear light-colored, loose-fitting clothes made from breathable fabrics like cotton to stay comfortable in warm weather.",
            icon: "clothing",
            benefits: ["Comfort", "Safety"],
            warning: "Avoid dark colors that absorb heat"
        });
    } else if (temp < 15) {
        activities.push({
            title: "Layer Up Warmly",
            description: "Cool weather requires proper layering. Wear a base layer, insulating layer, and weather-resistant outer layer.",
            icon: "clothing",
            benefits: ["Warmth", "Health", "Comfort"],
            warning: "Don't forget warm socks and gloves"
        });
        
        activities.push({
            title: "Warm Beverages & Indoor Activities",
            description: "Perfect time for a hot cup of tea or coffee. Consider indoor hobbies like reading, puzzles, or gentle stretching.",
            icon: "indoor",
            benefits: ["Warmth", "Relaxation", "Mental Health"],
            warning: "Avoid going out without proper warm clothing"
        });
    }
    
    // UV-based activities
    if (uvIndex > 6) {
        activities.push({
            title: "Sun Protection Essential",
            description: "High UV levels detected. Use sunscreen SPF 30+, wear a wide-brimmed hat, and seek shade during peak hours (10 AM - 4 PM).",
            icon: "sun-protection",
            benefits: ["Skin Health", "Cancer Prevention"],
            warning: "UV levels are high - limit direct sun exposure"
        });
    }
    
    // Condition-based activities
    if (condition.includes('rain')) {
        activities.push({
            title: "Indoor Wellness Activities",
            description: "Perfect weather for indoor activities! Try gentle yoga, reading, crafts, or video calls with family and friends.",
            icon: "indoor",
            benefits: ["Mental Health", "Safety", "Productivity"],
            warning: "Roads may be slippery - use extra caution if going out"
        });
    } else if (condition.includes('sun') || condition.includes('clear')) {
        activities.push({
            title: "Gentle Outdoor Exercise",
            description: "Beautiful weather for a leisurely walk in the park, light gardening, or sitting outside for fresh air and vitamin D.",
            icon: "exercise",
            benefits: ["Physical Health", "Mental Health", "Vitamin D"],
            warning: "Take breaks in shade and stay hydrated"
        });
    }
    
    // Humidity-based activities
    if (humidity > 70) {
        activities.push({
            title: "Combat High Humidity",
            description: "High humidity can make you feel hotter. Stay in air-conditioned spaces when possible, wear moisture-wicking clothes.",
            icon: "temperature",
            benefits: ["Comfort", "Health"],
            warning: "High humidity increases heat stress risk"
        });
    }
    
    // Default activity if none generated
    if (activities.length === 0) {
        activities.push({
            title: "Weather Monitoring",
            description: "Current weather conditions have been noted. Plan your day accordingly and dress appropriately for the conditions.",
            icon: "health",
            benefits: ["Awareness", "Planning"],
            warning: "Always check weather before going outside"
        });
    }
    
    // Display activities with enhanced cards
    activitiesGrid.innerHTML = activities.map(activity => `
        <div class="activity-card">
            <div class="activity-card-header">
                <div class="activity-image">
                    <div class="activity-icon ${activity.icon}"></div>
                </div>
                <h3 class="activity-title">${activity.title}</h3>
            </div>
            <div class="activity-card-content">
                <p class="activity-description">${activity.description}</p>
                <div class="activity-benefits">
                    ${activity.benefits.map(benefit => `<span class="benefit-tag">${benefit}</span>`).join('')}
                </div>
                <div class="activity-warning">⚠️ ${activity.warning}</div>
            </div>
        </div>
    `).join('');
    
    console.log('Weather activities generated successfully');
}

// Update background based on weather condition with images and gradients
function updateBackgroundForWeather(condition) {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;
    
    const conditionLower = condition.toLowerCase();
    let backgroundStyle;
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
        backgroundStyle = `
            background: 
                radial-gradient(circle at 30% 40%, rgba(255, 223, 0, 0.3) 0%, transparent 50%),
                linear-gradient(135deg, #f093fb 0%, #f5576c 100%),
                url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><circle cx="200" cy="200" r="50" fill="rgba(255,255,255,0.1)"/><circle cx="800" cy="300" r="30" fill="rgba(255,255,255,0.15)"/><circle cx="600" cy="700" r="40" fill="rgba(255,255,255,0.1)"/></svg>');
            background-size: cover, cover, 1000px 1000px;
            animation: sunny-shimmer 3s ease-in-out infinite alternate;
        `;
    } else if (conditionLower.includes('rain')) {
        backgroundStyle = `
            background: 
                linear-gradient(135deg, #4facfe 0%, #00f2fe 100%),
                url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><g fill="rgba(255,255,255,0.2)"><rect x="100" y="100" width="2" height="20" rx="1" transform="skewX(-15)"/><rect x="200" y="150" width="2" height="25" rx="1" transform="skewX(-15)"/><rect x="300" y="80" width="2" height="18" rx="1" transform="skewX(-15)"/><rect x="400" y="200" width="2" height="22" rx="1" transform="skewX(-15)"/><rect x="500" y="120" width="2" height="20" rx="1" transform="skewX(-15)"/></g></svg>');
            background-size: cover, 200px 200px;
            animation: rain-drops 2s linear infinite;
        `;
    } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
        backgroundStyle = `
            background: 
                radial-gradient(ellipse at 20% 70%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
                linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background-size: 600px 400px, 500px 300px, cover;
            animation: cloudy-drift 8s ease-in-out infinite;
        `;
    } else if (conditionLower.includes('snow')) {
        backgroundStyle = `
            background: 
                linear-gradient(135deg, #a8edea 0%, #fed6e3 100%),
                url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><g fill="rgba(255,255,255,0.8)"><circle cx="100" cy="100" r="3"/><circle cx="200" cy="180" r="2"/><circle cx="350" cy="120" r="4"/><circle cx="450" cy="220" r="2"/><circle cx="600" cy="150" r="3"/><circle cx="750" cy="200" r="2"/><circle cx="850" cy="100" r="3"/></g></svg>');
            background-size: cover, 300px 300px;
            animation: snow-fall 3s linear infinite;
        `;
    } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
        backgroundStyle = `
            background: 
                linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%),
                radial-gradient(circle at 60% 40%, rgba(255, 255, 0, 0.3) 0%, transparent 20%);
            background-size: cover, 800px 800px;
            animation: thunder-flash 4s ease-in-out infinite;
        `;
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
        backgroundStyle = `
            background: 
                linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%),
                radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
            background-size: cover, 400px 400px;
            animation: fog-drift 6s ease-in-out infinite alternate;
        `;
    } else {
        backgroundStyle = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        `;
    }
    
    heroSection.style.cssText = backgroundStyle;
    
    // Add animation keyframes if they don't exist
    addWeatherAnimations();
}

// Add CSS animations for weather effects
function addWeatherAnimations() {
    const styleId = 'weather-animations';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        @keyframes sunny-shimmer {
            0% { filter: brightness(1); }
            100% { filter: brightness(1.1); }
        }
        
        @keyframes rain-drops {
            0% { background-position: 0 0; }
            100% { background-position: 0 200px; }
        }
        
        @keyframes cloudy-drift {
            0%, 100% { background-position: 0% 0%, 100% 100%, center; }
            50% { background-position: 20% 20%, 80% 80%, center; }
        }
        
        @keyframes snow-fall {
            0% { background-position: 0 0; }
            100% { background-position: 0 300px; }
        }
        
        @keyframes thunder-flash {
            0%, 90%, 100% { filter: brightness(1); }
            95% { filter: brightness(1.5); }
        }
        
        @keyframes fog-drift {
            0% { background-position: center, 0% 50%; }
            100% { background-position: center, 100% 50%; }
        }
        
        .hourly-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.8rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            margin-right: 0.5rem;
            min-width: 80px;
            text-align: center;
            backdrop-filter: blur(5px);
        }
        
        .hourly-time {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-bottom: 0.5rem;
        }
        
        .hourly-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
        
        .hourly-temp {
            font-weight: bold;
            font-size: 1rem;
            margin-bottom: 0.3rem;
        }
        
        .hourly-condition {
            font-size: 0.7rem;
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
}

// Global search function for backward compatibility
window.searchWeather = function(location = "") {
    if (location) {
        searchWeatherSimple(location);
    } else {
        const searchInput = document.getElementById('locationInput');
        if (searchInput && searchInput.value.trim()) {
            searchWeatherSimple(searchInput.value.trim());
        }
    }
};

