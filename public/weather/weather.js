const WEATHER_CONFIG = {
    baseURL: (() => {
        const isLiveServer = window.location.port === '5500' || window.location.hostname === '127.0.0.1';
        return isLiveServer ? 'http://localhost:3000/api' : '/api';
    })(),
    endpoints: {
        weather: '/weather'
    },
    defaultLocation: 'Singapore'
};

class WeatherAppLoader {
    constructor() {
        this.config = WEATHER_CONFIG;
    }

    async initializeApp() {
        try {
            const location = this.config.defaultLocation;
            const response = await fetch(`${this.config.baseURL}${this.config.endpoints.weather}?location=${encodeURIComponent(location)}`);
            if (!response.ok) throw new Error('Failed to fetch weather data');
            const data = await response.json();
            
            // Set Singapore background image by default
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1506351421178-63b52a2d2562?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`;
                heroSection.style.backgroundSize = 'cover';
                heroSection.style.backgroundPosition = 'center';
                heroSection.style.backgroundRepeat = 'no-repeat';
            }
            
            this.updateWeatherDisplay(data);
        } catch (error) {
            console.error('Failed to initialize weather app:', error);
            this.showError('Weather application failed to start. Please refresh the page.');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
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
            ">
                <div style="
                    background: #dc3545;
                    padding: 2rem;
                    border-radius: 10px;
                    text-align: center;
                    max-width: 400px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                ">
                    <h3>Application Error</h3>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" style="
                        background: white;
                        color: #dc3545;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 5px;
                        margin-top: 1rem;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 1rem;
                    ">Refresh Page</button>
                </div>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    updateWeatherDisplay(data) {
        if (data.error) {
            this.showError(data.error);
            return;
        }

        function setText(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
        
        // Location and temperature
        setText('displayLocation', data.location || 'Unknown Location');
        setText('tempValue', typeof data.temperature === 'number' ? Math.round(data.temperature) : '--');
        setText('tempDescription', data.condition || '--');
        
        // Date and time display
        const now = new Date();
        const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = now.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        setText('weatherDesc', `${dayName}, ${dateStr} at ${timeStr}`);
        
        // Weather details
        setText('humidity', `Humidity: ${data.humidity !== undefined ? data.humidity + '%' : '--'}`);
        setText('realFeel', `Feels Like: ${data.feelsLike !== undefined ? Math.round(data.feelsLike) + '°C' : '--'}`);
        setText('uvIndex', `UV Index: ${data.uvIndex !== undefined ? data.uvIndex : '--'}`);
        setText('visibility', `Visibility: ${data.visibility !== undefined ? data.visibility + ' km' : '--'}`);
        
        // Wind and pressure info
        const windInfo = document.getElementById('windInfo');
        if (windInfo && data.windSpeed) {
            windInfo.textContent = `Wind: ${data.windSpeed} km/h ${data.windDirection || ''}`;
            windInfo.style.display = 'block';
        }
        
        const pressureInfo = document.getElementById('pressureInfo');
        if (pressureInfo && data.pressure) {
            pressureInfo.textContent = `Pressure: ${data.pressure} mb`;
            pressureInfo.style.display = 'block';
        }

        // Set background image
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && data.imageUrl) {
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${data.imageUrl}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
        }

        // Update activities
        if (data.activities && data.activities.length > 0) {
            const compactActivitiesGrid = document.getElementById('compactActivitiesGrid');
            if (compactActivitiesGrid) {
                compactActivitiesGrid.style.display = 'block';
                
                const activityCards = data.activities.map((activity, index) => {
                    let title, description, icon;
                    
                    if (typeof activity === 'string') {
                        title = activity;
                        description = 'Activity recommended for current weather conditions.';
                        icon = ['🌱', '📚', '🚶', '🏠', '☕', '🎨', '🧘', '🌞', '❄️', '🌧️'][index % 10];
                    } else if (typeof activity === 'object' && activity.title) {
                        title = activity.title;
                        description = activity.description || 'Activity recommended for current weather conditions.';
                        icon = activity.icon || '🌟';
                    } else {
                        title = 'Activity';
                        description = 'Activity recommended for current weather conditions.';
                        icon = '🌟';
                    }
                    
                    return `
                        <div class="activity-card">
                            <div class="activity-title">
                                <span class="activity-icon">${icon}</span>
                                ${title}
                            </div>
                            <div class="activity-description">
                                ${description}
                            </div>
                        </div>
                    `;
                }).join('');
                
                compactActivitiesGrid.innerHTML = activityCards;

                const cards = document.querySelectorAll('.activity-card');
                cards.forEach((card, i) => {
                    card.classList.remove('slide-in');
                    setTimeout(() => {
                        card.classList.add('slide-in');
                    }, i * 80); // Stagger animation
                });
            }
        }

        // Update forecast
        this.updateForecast(data);
        
        // Clear error display
        const errorDiv = document.getElementById('weatherError');
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
    }

    updateForecast(data) {
        // Update hourly forecast
        if (data.hourly && data.hourly.length > 0) {
            const hourlyContainer = document.querySelector('.hourly-forecast-container');
            if (hourlyContainer) {
                const hourlyHTML = data.hourly.slice(0, 10).map(hour => {
                    const time = new Date(hour.time).getHours();
                    const timeStr = time === 0 ? '12 AM' : time > 12 ? `${time - 12} PM` : `${time} AM`;
                    const humidity = hour.humidity || '--';
                    const windSpeed = hour.wind_kph || '--';
                    return `
                        <div class="hourly-item">
                            <div class="hour-time">${timeStr}</div>
                            <div class="hour-emoji">${this.getWeatherEmoji(hour.condition.text)}</div>
                            <div class="hour-temp">${Math.round(hour.temp_c)}°</div>
                            <div class="hour-details">
                                <div class="hour-humidity">💧 ${humidity}%</div>
                                <div class="hour-wind">💨 ${windSpeed} km/h</div>
                            </div>
                        </div>
                    `;
                }).join('');
                hourlyContainer.innerHTML = hourlyHTML;
            }
        } else {
            const hourlyContainer = document.querySelector('.hourly-forecast-container');
            if (hourlyContainer) {
                hourlyContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">Hourly data not available</p>';
            }
        }

        // Update weekly forecast
        if (data.forecast && data.forecast.length > 0) {
            const dailyContainer = document.querySelector('.daily-forecast-container');
            if (dailyContainer) {
                const dailyHTML = data.forecast.map(day => {
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const maxTemp = Math.round(day.day.maxtemp_c || day.day.avgtemp_c);
                    const minTemp = Math.round(day.day.mintemp_c || day.day.avgtemp_c);
                    const humidity = day.day.avghumidity || '--';
                    const windSpeed = day.day.maxwind_kph || '--';
                    return `
                        <div class="day-forecast">
                            <div class="forecast-day">${dayName}</div>
                            <div class="forecast-date">${dateStr}</div>
                            <div class="forecast-emoji">${this.getWeatherEmoji(day.day.condition.text)}</div>
                            <div class="forecast-temp">
                                <span class="max-temp">${maxTemp}°</span>
                                <span class="min-temp">${minTemp}°</span>
                            </div>
                            <div class="forecast-desc">${day.day.condition.text}</div>
                            <div class="forecast-details">
                                <div class="forecast-humidity">💧 ${humidity}%</div>
                                <div class="forecast-wind">💨 ${windSpeed} km/h</div>
                            </div>
                        </div>
                    `;
                }).join('');
                dailyContainer.innerHTML = dailyHTML;
            }
        } else {
            const dailyContainer = document.querySelector('.daily-forecast-container');
            if (dailyContainer) {
                dailyContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">Forecast data not available</p>';
            }
        }
    }

    getWeatherEmoji(condition) {
        if (!condition) return '🌤️';
        const conditionLower = condition.toLowerCase();
        if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return '☀️';
        if (conditionLower.includes('rain')) return '🌧️';
        if (conditionLower.includes('cloud')) return '☁️';
        if (conditionLower.includes('storm')) return '⛈️';
        if (conditionLower.includes('snow')) return '❄️';
        return '🌤️';
    }
}

// Search weather function
window.searchWeather = async function(location = "") {
    try {
        const config = WEATHER_CONFIG;
        const loc = location || config.defaultLocation;
        
        const response = await fetch(`${config.baseURL}${config.endpoints.weather}?location=${encodeURIComponent(loc)}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch weather data`);
        }
        
        const data = await response.json();
        
        // Set Singapore background image if searching for Singapore
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && (loc.toLowerCase() === 'singapore' || loc.toLowerCase() === 'sg')) {
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1506351421178-63b52a2d2562?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
            heroSection.style.backgroundRepeat = 'no-repeat';
        }
        
        const loader = window.weatherAppLoaderInstance;
        if (loader) {
            loader.updateWeatherDisplay(data);
        }
    } catch (error) {
        console.error('Search weather error:', error);
        const errorDiv = document.getElementById('weatherError');
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const loader = new WeatherAppLoader();
        window.weatherAppLoaderInstance = loader;
        await loader.initializeApp();
    } catch (error) {
        console.error('Failed to start weather app:', error);
    }
});