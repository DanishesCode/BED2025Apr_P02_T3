const fetch = require('node-fetch');
const weatherModel = require('../models/weatherModel');

module.exports = {
  async getWeather(req, res) {
    try {
      const location = req.query.location;
      if (!location) return res.status(400).json({ success: false, error: 'Location parameter is required' });
      
      const apiKey = process.env.WEATHER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: 'Weather API key not configured' });
      }
      
      console.log('API Key available:', !!apiKey);
      console.log('Location requested:', location);
      
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=7&aqi=yes&alerts=yes`;
      const response = await fetch(url);
      const rawData = await response.json();
      
      console.log('API URL called:', url);
      console.log('Raw API response keys:', Object.keys(rawData));
      console.log('Forecast object structure:', rawData.forecast ? Object.keys(rawData.forecast) : 'No forecast');
      console.log('First forecast day:', rawData.forecast?.forecastday?.[0]);
      
      if (!response.ok) {
        return res.status(400).json({ 
          success: false, 
          error: rawData.error?.message || 'Failed to fetch weather data' 
        });
      }

      // Process the raw weather data into a more usable format
      const current = rawData.current;
      const location_data = rawData.location;
      
      // Format location as "Country, City"
      const formattedLocation = `${location_data.country}, ${location_data.name}`;
      
      // Get location image if available
      let imageUrl = null;
      try {
        imageUrl = await weatherModel.getLocationImage(location_data.name, location_data.country);
      } catch (error) {
        console.log('Failed to fetch location image:', error.message);
      }

      // Get activities with descriptions
      const activitiesWithDescriptions = weatherModel.getElderlyActivitiesWithDescriptions({
        condition: current.condition.text,
        temp_c: current.temp_c,
        uv: current.uv
      });

      console.log('Weather condition:', current.condition.text);
      console.log('Temperature:', current.temp_c);
      console.log('UV Index:', current.uv);
      console.log('Activities returned:', activitiesWithDescriptions);
      console.log('Forecast data available:', !!rawData.forecast);
      console.log('Hourly data available:', !!rawData.forecast?.forecastday?.[0]?.hour);

      // Format the response data
      const weatherData = {
        location: formattedLocation,
        country: location_data.country,
        city: location_data.name,
        temperature: current.temp_c,
        temp_f: current.temp_f,
        condition: current.condition.text,
        humidity: current.humidity,
        feelsLike: current.feelslike_c,
        uvIndex: current.uv,
        visibility: current.vis_km,
        windSpeed: current.wind_kph,
        windDirection: current.wind_dir,
        pressure: current.pressure_mb,
        lastUpdated: current.last_updated,
        imageUrl: imageUrl,
        emoji: weatherModel.getWeatherEmoji(current.condition.text),
        activities: activitiesWithDescriptions,
        forecast: rawData.forecast?.forecastday || [],
        hourly: rawData.forecast?.forecastday?.[0]?.hour || []
      };

      console.log('Final weather data being sent:', weatherData);
      console.log('Forecast array length:', weatherData.forecast.length);
      console.log('Hourly array length:', weatherData.hourly.length);
      
      // If no forecast data, create basic fallback
      if (weatherData.forecast.length === 0) {
        console.log('Creating fallback forecast data');
        const today = new Date();
        weatherData.forecast = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          weatherData.forecast.push({
            date: date.toISOString().split('T')[0],
            day: {
              avgtemp_c: current.temp_c + (Math.random() - 0.5) * 5,
              condition: { text: current.condition.text }
            }
          });
        }
      }
      
      if (weatherData.hourly.length === 0) {
        console.log('Creating fallback hourly data');
        weatherData.hourly = [];
        for (let i = 0; i < 10; i++) {
          const time = new Date();
          time.setHours(time.getHours() + i);
          weatherData.hourly.push({
            time: time.toISOString(),
            temp_c: current.temp_c + (Math.random() - 0.5) * 3,
            condition: { text: current.condition.text }
          });
        }
      }
      
      res.json(weatherData);
    } catch (error) {
      console.error('Weather API error:', error);
      res.status(500).json({ success: false, error: 'Internal server error while fetching weather data' });
    }
  },

  async searchLocations(req, res) {
    try {
      const q = req.query.q;
      if (!q) return res.status(400).json({ success: false, error: 'Search query parameter is required' });
      const apiKey = process.env.WEATHER_API_KEY;
      const url = `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${encodeURIComponent(q)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) return res.status(400).json({ success: false, error: 'Failed to search locations' });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error while searching locations' });
    }
  }
};
