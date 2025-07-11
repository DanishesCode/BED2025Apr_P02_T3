// Weather Model - Handles data fetching and business logic

class WeatherModel {
    constructor() {
        // Get API key from environment variables
        this.apiKey = this.getApiKey();
        this.singaporeImages = {
            // Central Business District & Downtown
            'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920', // Marina Bay Sands skyline
            'Marina Bay': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920',
            'Raffles Place': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920', // Financial district
            'City Hall': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920',
            'Tanjong Pagar': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920',
            
            // Central Region
            'Orchard': 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1920', // Shopping district
            'Newton': 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1920',
            'Novena': 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1920',
            'Toa Payoh': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920',
            'Bishan': 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1920',
            
            // East Region
            'Changi': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920', // Airport/coastal area
            'Pasir Ris': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            'Tampines': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920', // HDB town
            'Bedok': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920',
            'Simei': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920',
            'Tanah Merah': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920',
            
            // North Region
            'Woodlands': 'https://images.unsplash.com/photo-1595435742656-5272d0e3ba08?w=1920', // Green suburban area
            'Yishun': 'https://images.unsplash.com/photo-1595435742656-5272d0e3ba08?w=1920',
            'Sembawang': 'https://images.unsplash.com/photo-1595435742656-5272d0e3ba08?w=1920',
            'Ang Mo Kio': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920',
            'Hougang': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920',
            'Punggol': 'https://images.unsplash.com/photo-1595435742656-5272d0e3ba08?w=1920',
            'Sengkang': 'https://images.unsplash.com/photo-1595435742656-5272d0e3ba08?w=1920',
            
            // West Region
            'Jurong': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920', // Industrial/residential west
            'Jurong East': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920',
            'Jurong West': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920',
            'Clementi': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920',
            'Bukit Batok': 'https://images.unsplash.com/photo-1595435742656-5272d0e3ba08?w=1920',
            'Bukit Panjang': 'https://images.unsplash.com/photo-1595435742656-5272d0e3ba08?w=1920',
            'Choa Chu Kang': 'https://images.unsplash.com/photo-1595435742656-5272d0e3ba08?w=1920',
            'Tuas': 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=1920',
            
            // South Region
            'Sentosa': 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1920', // Beach/resort island
            'HarbourFront': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920',
            'Tiong Bahru': 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1920',
            'Outram': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920',
            
            // Special Areas
            'Little India': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920', // Cultural district
            'Chinatown': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920',
            'Kampong Glam': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920',
            'Boat Quay': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920',
            'Clarke Quay': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920',
            
            // Nature Areas
            'Bukit Timah': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920', // Nature reserve
            'MacRitchie': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920',
            'East Coast': 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1920', // Beach area
            'West Coast': 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1920'
        };
        
        // Keep some international images as fallback
        this.countryImages = {
            'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920',
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
     * Get API key from environment variables
     * @returns {string} Weather API key
     */
    getApiKey() {
        // Check for Node.js environment (server-side)
        if (typeof process !== 'undefined' && process.env) {
            const apiKey = process.env.WEATHER_API_KEY;
            if (!apiKey) {
                console.error('❌ WEATHER_API_KEY not found in environment variables');
                throw new Error('Weather API key not configured. Please check your .env file.');
            }
            return apiKey;
        }
        
        // Check for browser environment with exposed env vars
        if (typeof window !== 'undefined' && window.ENV) {
            const apiKey = window.ENV.WEATHER_API_KEY;
            if (!apiKey) {
                console.error('❌ WEATHER_API_KEY not found in window.ENV');
                throw new Error('Weather API key not configured.');
            }
            return apiKey;
        }
        
        // Fallback for development (remove in production)
        console.warn('⚠️ Using fallback API key. Please configure environment variables.');
        return 'b4389571ae284ebc84d83842250607'; // Temporary fallback
    }

    /**
     * Validate API key
     * @returns {boolean} True if API key is valid
     */
    validateApiKey() {
        if (!this.apiKey || this.apiKey.length < 10) {
            console.error('❌ Invalid or missing Weather API key');
            return false;
        }
        return true;
    }

    /**
     * Fetch weather data from WeatherAPI
     * @param {string} location - Location to get weather for
     * @returns {Promise<Object>} Weather data object
     */
    async fetchWeatherData(location) {
        // Validate API key before making request
        if (!this.validateApiKey()) {
            return {
                success: false,
                error: 'Weather API key is not configured properly'
            };
        }

        const url = `https://api.weatherapi.com/v1/forecast.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&days=7&aqi=no&alerts=no`;
        
        try {
            console.log('🌤️ Fetching weather data for:', location);
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || 'Location not found');
            }
            
            // Get hourly forecast for next 10 hours (from first 2 days)
            const hourlyForecast = this.extractHourlyForecast(data.forecast.forecastday.slice(0, 2));
            
            console.log('✅ Weather data fetched successfully');
            
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
            console.error('❌ Weather API Error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ... rest of your existing methods remain the same ...
    
    /**
     * Get location image using Singapore-focused mapping
     * @param {string} locationName - Name of the location
     * @param {string} countryName - Name of the country
     * @returns {Promise<string>} Image URL
     */
    async getLocationImage(locationName, countryName) {
        try {
            // If it's Singapore, check for specific location images first
            if (countryName === 'Singapore') {
                // Check for exact location match
                if (this.singaporeImages[locationName]) {
                    return this.singaporeImages[locationName];
                }
                
                // Check for partial matches (e.g., "Jurong East" matches "Jurong")
                const locationLower = locationName.toLowerCase();
                for (const [area, image] of Object.entries(this.singaporeImages)) {
                    if (locationLower.includes(area.toLowerCase()) || area.toLowerCase().includes(locationLower)) {
                        return image;
                    }
                }
                
                // Default Singapore image if no specific match
                return this.singaporeImages['Singapore'];
            }
            
            // Check if we have a curated image for other countries
            if (this.countryImages[countryName]) {
                return this.countryImages[countryName];
            }
            
            // Use Lorem Picsum with location-based seed for consistent images
            const seed = `${locationName}${countryName}`.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
            return `https://picsum.photos/seed/${seed}/1920/1080`;
            
        } catch (error) {
            console.error("Error getting location image:", error);
            // Default fallback image (Singapore skyline)
            return 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920';
        }
    }

    // ... include all your other existing methods ...
    
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

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

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

    isCurrentHour(time, now) {
        return time.getHours() === now.getHours() && 
               time.getDate() === now.getDate();
    }

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

    getElderlyActivities(weatherData) {
        const condition = weatherData.condition.toLowerCase();
        const temp = weatherData.temp_c;
        const humidity = weatherData.humidity;
        const uv = weatherData.uv;
        
        let activities = [];
        
        // Sunny and pleasant weather (15-25°C)
        if ((condition.includes('sunny') || condition.includes('clear')) && temp >= 15 && temp <= 25 && uv <= 6) {
            activities = [
                {
                    icon: '🚶‍♂️',
                    title: 'Morning Garden Walk',
                    description: 'Perfect weather for a gentle stroll in the garden or park. The moderate temperature and sunshine provide ideal conditions for light exercise.',
                    benefits: ['Vitamin D', 'Light Exercise', 'Fresh Air', 'Mental Wellness'],
                    type: 'safe',
                    image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=250&fit=crop'
                },
                {
                    icon: '🌱',
                    title: 'Outdoor Gardening',
                    description: 'Great time to tend to plants, water flowers, or do light gardening work. The pleasant weather makes outdoor activities enjoyable.',
                    benefits: ['Physical Activity', 'Productivity', 'Nature Connection'],
                    type: 'safe',
                    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=250&fit=crop'
                },
                {
                    icon: '🪑',
                    title: 'Porch Reading',
                    description: 'Sit comfortably outside with a good book or newspaper. The natural light is perfect for reading without strain.',
                    benefits: ['Relaxation', 'Mental Stimulation', 'Fresh Air'],
                    type: 'safe',
                    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop'
                }
            ];
        }
        // Hot weather (>25°C) or high UV
        else if (temp > 25 || uv > 6) {
            activities = [
                {
                    icon: '🏠',
                    title: 'Indoor Light Exercises',
                    description: 'Stay cool indoors with gentle stretching, yoga, or chair exercises. Avoid outdoor activities during peak heat hours.',
                    benefits: ['Stay Cool', 'Safe Exercise', 'Flexibility'],
                    type: 'warning',
                    image: 'https://images.unsplash.com/photo-1506629905607-a5f4caac9b6f?w=400&h=250&fit=crop'
                },
                {
                    icon: '💧',
                    title: 'Hydration & Rest',
                    description: 'Focus on staying well-hydrated and taking frequent breaks in air-conditioned spaces. Drink water regularly.',
                    benefits: ['Prevent Dehydration', 'Temperature Regulation'],
                    type: 'warning',
                    image: 'https://images.unsplash.com/photo-1550837368-6594235de85c?w=400&h=250&fit=crop'
                },
                {
                    icon: '🌅',
                    title: 'Early Morning Activities',
                    description: 'If going outside, plan activities for early morning (before 9 AM) when temperatures are cooler.',
                    benefits: ['Cooler Temperature', 'Safe Timing', 'Fresh Air'],
                    type: 'warning',
                    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop'
                }
            ];
        }
        // ... rest of the activity logic remains the same
        
        return activities;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherModel;
}