// Weather Model - Handles data fetching and business logic

class WeatherModel {
    constructor() {
        this.apiKey = "b4389571ae284ebc84d83842250607";
        this.countryImages = {
            'United States': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=1920',
            'United Kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920',
            'France': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=1920',
            'Japan': 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=1920',
            'Italy': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1920',
            'Germany': 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1920',
            'Spain': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1920',
            'India': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920',
            'China': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1920',
            'Australia': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
            'Canada': 'https://images.unsplash.com/photo-1503614472-8c93d56cd601?w=1920',
            'Brazil': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920'
        };
    }

    /**
     * Fetch weather data from WeatherAPI
     * @param {string} location - Location to get weather for
     * @returns {Promise<Object>} Weather data object
     */
    async fetchWeatherData(location) {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&days=7&aqi=no&alerts=no`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || 'Location not found');
            }
            
            // Get hourly forecast for next 10 hours (from first 2 days)
            const hourlyForecast = this.extractHourlyForecast(data.forecast.forecastday.slice(0, 2));
            
            return {
                success: true,
                data: {
                    location: {
                        name: data.location.name,
                        country: data.location.country
                    },
                    current: {
                        temp_c: Math.round(data.current.temp_c),
                        condition: data.current.condition.text,
                        emoji: this.getWeatherEmoji(data.current.condition.text),
                        backgroundEmoji: this.getBackgroundWeatherEmoji(data.current.condition.text),
                        humidity: data.current.humidity,
                        feelslike_c: Math.round(data.current.feelslike_c),
                        uv: data.current.uv,
                        vis_km: data.current.vis_km
                    },
                    forecast: data.forecast.forecastday.map(day => ({
                        date: day.date,
                        day: {
                            maxtemp_c: Math.round(day.day.maxtemp_c),
                            mintemp_c: Math.round(day.day.mintemp_c),
                            condition: day.day.condition.text,
                            emoji: this.getWeatherEmoji(day.day.condition.text),
                            icon: day.day.condition.icon
                        }
                    })),
                    hourly: hourlyForecast
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate image URL using Lorem Picsum with location-based seed
     * @param {string} locationName - Name of the location
     * @param {string} countryName - Name of the country
     * @returns {string} Image URL
     */
    async fetchLocationImage(locationName, countryName) {
        try {
            // Generate a seed based on location for consistent images per location
            const seed = (locationName + countryName).toLowerCase().replace(/[^a-z]/g, '');
            const imageUrl = `https://picsum.photos/seed/${seed}/1920/1080`;
            return imageUrl;
        } catch (error) {
            console.error("Error generating location image:", error);
            return null;
        }
    }

    /**
     * Get curated country-specific images
     * @param {string} countryName - Name of the country
     * @returns {string|null} Image URL or null if not found
     */
    getCuratedLocationImage(countryName) {
        return this.countryImages[countryName] || null;
    }

    /**
     * Fetch location image with fallback strategy
     * @param {string} locationName - Name of the location
     * @param {string} countryName - Name of the country
     * @returns {Promise<string|null>} Image URL or null
     */
    async getLocationImage(locationName, countryName) {
        // Try curated images first, then fallback to Lorem Picsum
        let imageUrl = this.getCuratedLocationImage(countryName);
        if (!imageUrl) {
            imageUrl = await this.fetchLocationImage(locationName, countryName);
        }
        return imageUrl;
    }

    /**
     * Alternative Pixabay API implementation (requires API key)
     * @param {string} locationName - Name of the location
     * @param {string} countryName - Name of the country
     * @returns {Promise<string|null>} Image URL or null
     */
    async fetchLocationImagePixabay(locationName, countryName) {
        const pixabayApiKey = "YOUR_PIXABAY_API_KEY"; // Replace with actual key
        
        try {
            const searchQuery = `${locationName} ${countryName} landscape`;
            const imageUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(searchQuery)}&image_type=photo&orientation=horizontal&category=places&per_page=3&safesearch=true`;
            
            const response = await fetch(imageUrl);
            const data = await response.json();
            
            if (data.hits && data.hits.length > 0) {
                return data.hits[0].largeImageURL;
            }
            
            return null;
        } catch (error) {
            console.error("Error fetching Pixabay image:", error);
            return null;
        }
    }

    /**
     * Format forecast dates to readable format
     * @param {Array} forecast - Array of forecast days
     * @returns {Array} Formatted forecast with readable dates
     */
    formatForecastDates(forecast) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        return forecast.map((day, index) => {
            const forecastDate = new Date(day.date);
            let dayName = '';

            if (this.isSameDate(forecastDate, yesterday)) {
                dayName = 'Yesterday';
            } else if (this.isSameDate(forecastDate, today)) {
                dayName = 'Today';
            } else if (this.isSameDate(forecastDate, tomorrow)) {
                dayName = 'Tomorrow';
            } else {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                dayName = dayNames[forecastDate.getDay()];
            }

            return {
                ...day,
                dayName,
                formattedDate: forecastDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                })
            };
        });
    }

    /**
     * Check if two dates are the same day
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {boolean} True if same day
     */
    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    /**
     * Extract next 10 hours of forecast from forecast data
     * @param {Array} forecastDays - Array of forecast days
     * @returns {Array} Array of hourly forecast for next 10 hours
     */
    extractHourlyForecast(forecastDays) {
        const now = new Date();
        const currentHour = now.getHours();
        const hourlyForecast = [];
        
        // Get all hours from today and tomorrow
        const allHours = [];
        
        forecastDays.forEach(day => {
            if (day.hour) {
                day.hour.forEach(hour => {
                    const hourTime = new Date(hour.time);
                    allHours.push({
                        time: hour.time,
                        temp_c: Math.round(hour.temp_c),
                        condition: hour.condition.text,
                        emoji: this.getWeatherEmoji(hour.condition.text),
                        icon: hour.condition.icon,
                        humidity: hour.humidity,
                        chance_of_rain: hour.chance_of_rain,
                        hourTime: hourTime
                    });
                });
            }
        });
        
        // Filter to get next 10 hours starting from current hour
        const filteredHours = allHours.filter(hour => {
            return hour.hourTime >= now;
        }).slice(0, 10);
        
        return filteredHours.map(hour => ({
            ...hour,
            displayTime: this.formatHourTime(hour.hourTime),
            isNow: this.isCurrentHour(hour.hourTime, now)
        }));
    }

    /**
     * Format hour time for display
     * @param {Date} time - Time object
     * @returns {string} Formatted time string
     */
    formatHourTime(time) {
        const now = new Date();
        
        if (this.isCurrentHour(time, now)) {
            return 'Now';
        }
        
        return time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
        });
    }

    /**
     * Check if the given time is the current hour
     * @param {Date} time - Time to check
     * @param {Date} now - Current time
     * @returns {boolean} True if current hour
     */
    isCurrentHour(time, now) {
        return time.getHours() === now.getHours() && 
               time.getDate() === now.getDate();
    }

    /**
     * Get weather emoji based on condition text
     * @param {string} condition - Weather condition text
     * @returns {string} Weather emoji
     */
    getWeatherEmoji(condition) {
        const conditionLower = condition.toLowerCase();
        
        // Sunny/Clear conditions
        if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
            return '☀️';
        }
        
        // Partly cloudy
        if (conditionLower.includes('partly cloudy') || conditionLower.includes('partly sunny')) {
            return '⛅';
        }
        
        // Cloudy/Overcast
        if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
            return '☁️';
        }
        
        // Rain conditions
        if (conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('shower')) {
            if (conditionLower.includes('heavy') || conditionLower.includes('torrential')) {
                return '🌧️';
            }
            return '🌦️';
        }
        
        // Thunderstorm
        if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
            return '⛈️';
        }
        
        // Snow conditions
        if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) {
            return '❄️';
        }
        
        // Fog/Mist
        if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) {
            return '🌫️';
        }
        
        // Wind
        if (conditionLower.includes('wind')) {
            return '💨';
        }
        
        // Default for unknown conditions
        return '🌤️';
    }

    /**
     * Get background emoji based on weather condition (for hero section)
     * @param {string} condition - Weather condition text
     * @returns {string} Background weather emoji
     */
    getBackgroundWeatherEmoji(condition) {
        const conditionLower = condition.toLowerCase();
        
        if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
            return '☀️🌞';
        }
        
        if (conditionLower.includes('rain') || conditionLower.includes('storm')) {
            return '🌧️⛈️';
        }
        
        if (conditionLower.includes('snow')) {
            return '❄️🌨️';
        }
        
        if (conditionLower.includes('cloudy')) {
            return '☁️⛅';
        }
        
        return '🌤️🌈';
    }
}
