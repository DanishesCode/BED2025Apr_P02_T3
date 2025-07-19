// Weather Controller - Handles user interactions and coordinates between model and view

class WeatherController {
    constructor() {
        this.model = new WeatherModel();
        this.currentLocation = '';
        this.refreshInterval = null;
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for the weather app
     */
    initializeEventListeners() {
        // Add Enter key listener for search input
        const searchInput = document.getElementById("locationInput");
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchWeather();
                }
            });
        }

        // Add click listener for search button
        const searchButton = document.querySelector('.search-btn');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.searchWeather();
            });
        }
    }

    /**
     * Main search weather function
     * @param {string} defaultLocation - Optional default location to search
     */
    async searchWeather(defaultLocation = "") {
        try {
            const location = this.getLocationInput(defaultLocation);
            
            // Validate location input
            if (!WeatherValidator.validateLocation(location)) {
                this.showError("Please enter a valid location.");
                return;
            }

            // Show loading state
            this.showLoadingState();

            // Fetch weather data
            const weatherResult = await this.model.fetchWeatherData(location);
            
            if (!weatherResult.success) {
                this.showError(`Error: ${weatherResult.error}`);
                this.hideLoadingState();
                return;
            }

            // Update weather display
            this.updateWeatherDisplay(weatherResult.data);

            // Update elderly activities based on current weather
            this.updateElderlyActivities(weatherResult.data.current);

            // Floating emojis removed as requested

            // Update forecast display
            if (weatherResult.data.forecast) {
                const formattedForecast = this.model.formatForecastDates(weatherResult.data.forecast);
                this.updateForecastDisplay(formattedForecast);
            }

            // Update hourly forecast display
            if (weatherResult.data.hourly) {
                this.updateHourlyForecastDisplay(weatherResult.data.hourly);
            }

            // Store current location for auto-refresh
            this.currentLocation = location;
            this.startAutoRefresh();

            // Fetch and update background image
            console.log(`🖼️ Fetching background image for: ${weatherResult.data.location.name}, ${weatherResult.data.location.country}`);
            
            const imageUrl = await this.model.getLocationImage(
                weatherResult.data.location.name, 
                weatherResult.data.location.country
            );
            
            console.log(`🎨 Got image URL: ${imageUrl}`);
            this.updateBackgroundImage(imageUrl);

            // Hide loading state
            this.hideLoadingState();

            // Clear input after successful search
            this.clearSearchInput();

        } catch (error) {
            console.error("Search error:", error);
            this.showError("Something went wrong. Please try again.");
            this.hideLoadingState();
        }
    }

    /**
     * Get location input from user or use default
     * @param {string} defaultLocation - Default location to use
     * @returns {string} Location string
     */
    getLocationInput(defaultLocation) {
        const inputElement = document.getElementById("locationInput");
        const userInput = inputElement ? inputElement.value.trim() : "";
        return defaultLocation.trim() || userInput;
    }

    /**
     * Update the weather display with new data
     * @param {Object} weatherData - Weather data object
     */
    updateWeatherDisplay(weatherData) {
        const elements = {
            displayLocation: document.getElementById("displayLocation"),
            tempValue: document.getElementById("tempValue"),
            weatherDesc: document.getElementById("weatherDesc"),
            humidity: document.getElementById("humidity"),
            realFeel: document.getElementById("realFeel"),
            uvIndex: document.getElementById("uvIndex"),
            visibility: document.getElementById("visibility")
        };

        // Update each element if it exists
        if (elements.displayLocation) {
            elements.displayLocation.textContent = `${weatherData.location.name}, ${weatherData.location.country}`;
        }
        
        if (elements.tempValue) {
            elements.tempValue.textContent = weatherData.current.temp_c;
        }
        
        if (elements.weatherDesc) {
            elements.weatherDesc.textContent = `${weatherData.current.emoji} ${weatherData.current.condition}`;
        }
        
        if (elements.humidity) {
            elements.humidity.textContent = `Humidity: ${weatherData.current.humidity}%`;
        }
        
        if (elements.realFeel) {
            elements.realFeel.textContent = `RealFeel: ${weatherData.current.feelslike_c}°C`;
        }
        
        if (elements.uvIndex) {
            elements.uvIndex.textContent = `UV Index: ${weatherData.current.uv}`;
        }
        
        if (elements.visibility) {
            elements.visibility.textContent = `Visibility: ${weatherData.current.vis_km} km`;
        }
    }

    /**
     * Update the forecast display with new data
     * @param {Array} forecastData - Array of forecast day objects
     */
    updateForecastDisplay(forecastData) {
        // Get the daily forecast container or create forecast items
        const dailyForecastContainer = document.querySelector('.daily-forecast-container');
        
        if (dailyForecastContainer) {
            // Clear existing forecast
            dailyForecastContainer.innerHTML = '';
            
            // Add forecast days
            forecastData.forEach((day, index) => {
                const forecastElement = this.createForecastElement(day, index);
                dailyForecastContainer.appendChild(forecastElement);
            });
        } else {
            // Update existing day-forecast elements (for the static HTML structure)
            this.updateStaticForecastElements(forecastData);
        }
    }

    /**
     * Create a forecast element for a day
     * @param {Object} day - Forecast day data
     * @param {number} index - Day index
     * @returns {HTMLElement} Forecast element
     */
    createForecastElement(day, index) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-forecast';
        
        dayElement.innerHTML = `
            <div class="forecast-emoji">${day.day.emoji}</div>
            <div class="forecast-temp">${day.day.maxtemp_c}°/${day.day.mintemp_c}°</div>
            <div class="forecast-desc">${day.day.condition}</div>
            <div class="forecast-day">${day.dayName}</div>
            <div class="forecast-date">${day.formattedDate}</div>
        `;
        
        return dayElement;
    }

    /**
     * Update static forecast elements in the existing HTML structure
     * @param {Array} forecastData - Array of forecast day objects
     */
    updateStaticForecastElements(forecastData) {
        const dayForecastElements = document.querySelectorAll('.day-forecast');
        
        dayForecastElements.forEach((element, index) => {
            if (forecastData[index]) {
                const day = forecastData[index];
                
                const emojiElement = element.querySelector('.forecast-emoji');
                const tempElement = element.querySelector('.forecast-temp');
                const descElement = element.querySelector('.forecast-desc');
                const dayElement = element.querySelector('.forecast-day');
                
                if (emojiElement) {
                    emojiElement.textContent = day.day.emoji;
                }
                
                if (tempElement) {
                    tempElement.textContent = `${day.day.maxtemp_c}°/${day.day.mintemp_c}°`;
                }
                
                if (descElement) {
                    descElement.textContent = day.day.condition;
                }
                
                if (dayElement) {
                    dayElement.textContent = day.dayName;
                }
            }
        });
    }

    /**
     * Update the hourly forecast display
     * @param {Array} hourlyData - Array of hourly forecast objects
     */
    updateHourlyForecastDisplay(hourlyData) {
        const hourlyContainer = document.querySelector('.hourly-forecast-container');
        
        if (hourlyContainer) {
            // Clear existing hourly forecast
            hourlyContainer.innerHTML = '';
            
            // Add hourly forecast items
            hourlyData.forEach((hour, index) => {
                const hourElement = this.createHourlyElement(hour, index);
                hourlyContainer.appendChild(hourElement);
            });
        }
    }

    /**
     * Create an hourly forecast element
     * @param {Object} hour - Hourly forecast data
     * @param {number} index - Hour index
     * @returns {HTMLElement} Hourly forecast element
     */
    createHourlyElement(hour, index) {
        const hourElement = document.createElement('div');
        hourElement.className = `hourly-item ${hour.isNow ? 'current-hour' : ''}`;
        
        hourElement.innerHTML = `
            <div class="hour-time">${hour.displayTime}</div>
            <div class="hour-emoji">${hour.emoji}</div>
            <div class="hour-temp">${hour.temp_c}°</div>
            <div class="hour-condition">${hour.condition}</div>
            <div class="hour-rain">💧 ${hour.chance_of_rain}%</div>
        `;
        
        return hourElement;
    }

    /**
     * Update the elderly activities display based on current weather
     * @param {Object} currentWeather - Current weather data
     */
    updateElderlyActivities(currentWeather) {
        const compactActivitiesGrid = document.getElementById('compactActivitiesGrid');
        
        // Get activities recommendations from the model
        const activities = this.model.getElderlyActivities(currentWeather);
        
        // Debug log to see what activities we're getting
        console.log('Activities from model:', activities);
        
        // Validate activities array
        if (!Array.isArray(activities) || activities.length === 0) {
            console.warn('No activities generated for current weather conditions');
            if (compactActivitiesGrid) {
                compactActivitiesGrid.style.display = 'none';
            }
            return;
        }
        
        // Show the compact activities section in the weather sidebar
        if (compactActivitiesGrid) {
            compactActivitiesGrid.style.display = 'grid';
            
            // Add slide-out animation for existing cards before clearing
            const existingCards = compactActivitiesGrid.querySelectorAll('.activity-card');
            if (existingCards.length > 0) {
                existingCards.forEach((card, index) => {
                    card.classList.add('sliding');
                    card.style.transform = 'translateX(30px)';
                    card.style.opacity = '0';
                });
                
                // Clear after slide-out animation
                setTimeout(() => {
                    compactActivitiesGrid.innerHTML = '';
                }, 300);
            } else {
                compactActivitiesGrid.innerHTML = '';
            }
            
                        // Add compact activity cards - Show 3 activities
            const addCardsWithDelay = () => {
                activities.slice(0, 3).forEach((activity, index) => { // Show first 3 activities
                    const activityElement = this.createCompactActivityElement(activity, index);
                    
                    // Set initial state for slide animation
                    activityElement.style.opacity = '0';
                    activityElement.style.transform = 'translateX(-30px)';
                    activityElement.classList.add('sliding');
                    
                    compactActivitiesGrid.appendChild(activityElement);
                    
                    // Small delay to ensure DOM is ready
                    requestAnimationFrame(() => {
                        // Trigger slide-in animation with staggered delay
                        setTimeout(() => {
                            activityElement.style.opacity = '1';
                            activityElement.style.transform = 'translateX(0)';
                            
                            // Remove sliding class after animation completes
                            setTimeout(() => {
                                activityElement.classList.remove('sliding');
                            }, 600);
                        }, 100 + (index * 150)); // Small initial delay + staggered delay for each card
                    });
                });
            };
            
            // Delay adding new cards if there were existing cards
            if (existingCards.length > 0) {
                setTimeout(addCardsWithDelay, 400); // Increased wait time for slide-out to complete
            } else {
                setTimeout(addCardsWithDelay, 50); // Small delay even when no existing cards
            }
        }
    }

    /**
     * Create a compact activity card element for the sidebar
     * @param {Object} activity - Activity data
     * @param {number} index - Activity index
     * @returns {HTMLElement} Compact activity card element
     */
    createCompactActivityElement(activity, index) {
        const activityElement = document.createElement('div');
        activityElement.className = `activity-card ${activity.type === 'warning' ? 'activity-warning' : ''}`;
        
        // Use the activity's icon if available, otherwise determine from title
        let icon = activity.icon || '🌟';
        
        activityElement.innerHTML = `
            <div class="activity-title">
                <span class="activity-icon">${icon}</span>
                ${activity.title || 'Weather Activity'}
            </div>
            <div class="activity-description">
                ${activity.description || 'Activity based on current weather conditions.'}
            </div>
            ${activity.tips ? `<div class="activity-tips">${activity.tips}</div>` : ''}
        `;
        
        return activityElement;
    }

    /**
     * Update full-size activities grid (for backward compatibility)
     * @param {HTMLElement} grid - Activities grid element
     * @param {Array} activities - Activities array
     */
    updateFullActivities(grid, activities) {
        if (!grid) return;
        
        // Prevent duplicate updates
        if (grid.classList.contains('loading')) {
            return;
        }
        
        grid.classList.add('loading');
        
        setTimeout(() => {
            grid.innerHTML = '';
            
            activities.forEach((activity, index) => {
                setTimeout(() => {
                    const activityElement = this.createActivityElement(activity, index);
                    grid.appendChild(activityElement);
                    
                    // Trigger entrance animation
                    requestAnimationFrame(() => {
                        activityElement.style.opacity = '0';
                        activityElement.style.transform = 'translateY(50px) scale(0.8)';
                        
                        requestAnimationFrame(() => {
                            activityElement.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                            activityElement.style.opacity = '1';
                            activityElement.style.transform = 'translateY(0) scale(1)';
                        });
                    });
                }, index * 150);
            });
            
            setTimeout(() => {
                grid.classList.remove('loading');
            }, activities.length * 150 + 200);
        }, 300);
    }

    /**
     * Get activity icon based on category
     * @param {string} category - Activity category
     * @returns {string} Icon emoji
     */
    getActivityIcon(category) {
        const icons = {
            'outdoor': '🚶‍♂️',
            'indoor': '🏠',
            'exercise': '💪',
            'health': '❤️',
            'clothing': '👕',
            'safety': '⚠️',
            'temperature': '🌡️',
            'sun-protection': '☂️',
            'hydration': '💧',
            'rest': '😴',
            'walk': '🚶‍♂️',
            'gardening': '🌱',
            'reading': '📚',
            'social': '👥',
            'creative': '🎨',
            'warm': '☕',
            'cold': '🧥',
            'general': '🌟'
        };
        return icons[category] || icons['general'];
    }

    /**
     * Create an activity card element
     * @param {Object} activity - Activity data
     * @param {number} index - Activity index
     * @returns {HTMLElement} Activity card element
     */
    createActivityElement(activity, index) {
        const activityElement = document.createElement('div');
        activityElement.className = `activity-card ${activity.type === 'warning' ? 'activity-warning' : ''}`;
        
        const benefitTags = activity.benefits.map(benefit => 
            `<span class="benefit-tag">${benefit}</span>`
        ).join('');
        
        activityElement.innerHTML = `
            <div class="activity-card-header">
                <div class="activity-image">
                    <div class="activity-icon ${this.getIconClass(activity.title)}"></div>
                </div>
            </div>
            <div class="activity-card-content">
                <h3 class="activity-title">${activity.title}</h3>
                <p class="activity-description">${activity.description}</p>
                <div class="activity-benefits">
                    ${benefitTags}
                </div>
            </div>
        `;
        
        // Add click interaction for better user experience
        activityElement.addEventListener('click', () => {
            // Add a subtle pulse effect on click
            activityElement.style.transform = 'scale(0.98)';
            setTimeout(() => {
                activityElement.style.transform = '';
            }, 150);
        });
        
        // Add keyboard accessibility
        activityElement.setAttribute('tabindex', '0');
        activityElement.setAttribute('role', 'button');
        activityElement.setAttribute('aria-label', `Activity: ${activity.title}. ${activity.description}`);
        
        return activityElement;
    }

    /**
     * Get appropriate icon class based on activity title
     * @param {string} title - Activity title
     * @returns {string} Icon class name
     */
    getIconClass(title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('hydration') || titleLower.includes('water') || titleLower.includes('drink')) {
            return 'hydration';
        } else if (titleLower.includes('exercise') || titleLower.includes('walk') || titleLower.includes('stretch') || titleLower.includes('yoga')) {
            return 'exercise';
        } else if (titleLower.includes('rest') || titleLower.includes('sleep') || titleLower.includes('nap')) {
            return 'rest';
        } else if (titleLower.includes('sun') || titleLower.includes('shade') || titleLower.includes('umbrella') || titleLower.includes('protection')) {
            return 'sun-protection';
        } else if (titleLower.includes('clothing') || titleLower.includes('dress') || titleLower.includes('wear')) {
            return 'clothing';
        } else if (titleLower.includes('indoor') || titleLower.includes('inside') || titleLower.includes('home')) {
            return 'indoor';
        } else if (titleLower.includes('health') || titleLower.includes('medical') || titleLower.includes('doctor')) {
            return 'health';
        } else if (titleLower.includes('temperature') || titleLower.includes('heat') || titleLower.includes('cold')) {
            return 'temperature';
        } else if (titleLower.includes('garden') || titleLower.includes('plant')) {
            return 'gardening';
        } else if (titleLower.includes('read') || titleLower.includes('book')) {
            return 'reading';
        } else if (titleLower.includes('social') || titleLower.includes('friend') || titleLower.includes('family')) {
            return 'social';
        } else if (titleLower.includes('creative') || titleLower.includes('art') || titleLower.includes('craft')) {
            return 'creative';
        } else if (titleLower.includes('warm') || titleLower.includes('beverage') || titleLower.includes('tea') || titleLower.includes('coffee')) {
            return 'warm';
        } else if (titleLower.includes('cold') || titleLower.includes('warm clothing')) {
            return 'cold';
        } else {
            return 'health'; // Default icon
        }
    }

    /**
     * Start auto-refresh for real-time updates
     */
    startAutoRefresh() {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Set up auto-refresh every 10 minutes (600,000 ms)
        this.refreshInterval = setInterval(() => {
            if (this.currentLocation) {
                console.log('Auto-refreshing weather data...');
                this.refreshWeatherData();
            }
        }, 600000); // 10 minutes
        
        console.log('Auto-refresh started (every 10 minutes)');
    }

    /**
     * Refresh weather data silently (without loading states)
     */
    async refreshWeatherData() {
        try {
            const weatherResult = await this.model.fetchWeatherData(this.currentLocation);
            
            if (weatherResult.success) {
                // Update displays silently (but NOT the background image)
                this.updateWeatherDisplay(weatherResult.data);
                
                // Update elderly activities based on current weather
                this.updateElderlyActivities(weatherResult.data.current);
                
                if (weatherResult.data.forecast) {
                    const formattedForecast = this.model.formatForecastDates(weatherResult.data.forecast);
                    this.updateForecastDisplay(formattedForecast);
                }
                
                if (weatherResult.data.hourly) {
                    this.updateHourlyForecastDisplay(weatherResult.data.hourly);
                }
                
                // Update last refresh time indicator
                this.updateLastRefreshTime();
                
                // NOTE: Background image is NOT updated during auto-refresh to prevent constant changes
            }
        } catch (error) {
            console.error("Auto-refresh error:", error);
        }
    }

    /**
     * Update last refresh time indicator
     */
    updateLastRefreshTime() {
        const refreshIndicator = document.querySelector('.last-refresh');
        if (refreshIndicator) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            refreshIndicator.textContent = `Updated: ${timeString}`;
        }
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('Auto-refresh stopped');
        }
    }

    /**
     * Update background image for both body and hero section
     * @param {string|null} imageUrl - Image URL or null for default
     */
    updateBackgroundImage(imageUrl) {
        console.log(`🎨 Updating background with: ${imageUrl}`);
        const heroSection = document.querySelector('.hero-section');

        if (imageUrl) {
            // Test if the image loads before applying it
            const testImg = new Image();
            testImg.onload = () => {
                console.log(`✅ Background image loaded successfully`);
                
                // Update BODY background
                document.body.style.background = `
                    linear-gradient(rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.4)),
                    url('${imageUrl}') center/cover no-repeat fixed
                `;
                document.body.style.transition = 'background 1s ease-in-out';

                // Update HERO-SECTION background
                if (heroSection) {
                    heroSection.style.background = `url('${imageUrl}') no-repeat center center/cover`;
                    heroSection.style.transition = 'background 1s ease-in-out';
                }
            };
            
            testImg.onerror = () => {
                console.error(`❌ Failed to load background image: ${imageUrl}`);
                console.log(`🔄 Falling back to default gradient`);
                this.setDefaultBackground(heroSection);
            };
            
            // Set timeout for image loading
            setTimeout(() => {
                if (!testImg.complete) {
                    console.warn(`⏰ Background image load timeout, using default`);
                    this.setDefaultBackground(heroSection);
                }
            }, 5000);
            
            testImg.src = imageUrl;
        } else {
            console.log(`🎨 No image URL provided, using default background`);
            this.setDefaultBackground(heroSection);
        }
    }

    /**
     * Set default gradient background
     * @param {HTMLElement} heroSection - Hero section element
     */
    setDefaultBackground(heroSection) {
        // Reset to default gradient if no image found
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        
        if (heroSection) {
            heroSection.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }

    /**
     * Add floating weather emojis to hero section
     * @param {string} backgroundEmoji - Background emoji string
     */
    addFloatingWeatherEmojis(backgroundEmoji) {
        // Remove existing floating emojis
        const existingEmojis = document.querySelectorAll('.floating-emoji');
        existingEmojis.forEach(emoji => emoji.remove());
        
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        const emojis = backgroundEmoji.split('');
        
        // Create 3-5 floating emojis
        for (let i = 0; i < Math.min(emojis.length + 1, 4); i++) {
            const emojiElement = document.createElement('div');
            emojiElement.className = 'floating-emoji';
            emojiElement.textContent = emojis[i % emojis.length];
            
            // Random positioning
            emojiElement.style.left = Math.random() * 80 + 10 + '%';
            emojiElement.style.top = Math.random() * 60 + 20 + '%';
            emojiElement.style.animationDelay = Math.random() * 2 + 's';
            
            heroSection.appendChild(emojiElement);
        }
    }

    /**
     * Show loading state in the UI
     */
    showLoadingState() {
        const searchBtn = document.querySelector('.search-btn');
        const tempValue = document.getElementById("tempValue");
        const weatherDesc = document.getElementById("weatherDesc");

        if (searchBtn) {
            searchBtn.textContent = 'Loading...';
            searchBtn.disabled = true;
        }

        if (tempValue) tempValue.textContent = '--';
        if (weatherDesc) weatherDesc.textContent = 'Loading...';
    }

    /**
     * Hide loading state in the UI
     */
    hideLoadingState() {
        const searchBtn = document.querySelector('.search-btn');
        
        if (searchBtn) {
            searchBtn.textContent = 'Search';
            searchBtn.disabled = false;
        }
    }

    /**
     * Clear the search input field
     */
    clearSearchInput() {
        const inputElement = document.getElementById("locationInput");
        if (inputElement) {
            inputElement.value = '';
        }
    }

    /**
     * Show error message to user
     * @param {string} message - Error message to display
     */
    showError(message) {
        // You can enhance this with a proper toast/modal system
        alert(message);
    }

    /**
     * Initialize the app with default location
     * @param {string} defaultLocation - Default location to load
     */
    init(defaultLocation = 'Chennai') {
        this.searchWeather(defaultLocation);
    }
}

// Global function for backward compatibility
function searchWeather(defaultLocation = "") {
    if (window.weatherController) {
        window.weatherController.searchWeather(defaultLocation);
    }
}
