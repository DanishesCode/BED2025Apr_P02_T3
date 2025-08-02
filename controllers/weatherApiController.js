const fetch = require('node-fetch');
const weatherModel = require('../models/weatherModel');

// Helper function for error responses
const sendError = (res, status, message, error = null) => {
  const response = { success: false, message };
  if (error) response.error = error.message;
  return res.status(status).json(response);
};


const sendSuccess = (res, status, message, data = null) => {
  const response = { success: true, message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

module.exports = {
  async getWeather(req, res) {
    try {
      const location = req.query.location;
      if (!location) {
        return sendError(res, 400, "Location parameter is required");
      }

      const apiKey = process.env.WEATHER_API_KEY;
      if (!apiKey) {
        return sendError(res, 500, "Weather API key not configured");
      }

      console.log('API Key available:', !!apiKey);
      console.log('Location requested:', location);

      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=7&aqi=yes&alerts=yes`;

      let response, rawData;
      try {
        response = await fetch(url);
        rawData = await response.json();
      } catch (error) {
        console.error('Error fetching weather data:', error);
        return sendError(res, 500, "Failed to fetch weather data from external API", error);
      }

      console.log('API URL called:', url);
      console.log('Raw API response keys:', Object.keys(rawData));
      console.log('Forecast object structure:', rawData.forecast ? Object.keys(rawData.forecast) : 'No forecast');
      console.log('First forecast day:', rawData.forecast?.forecastday?.[0]);

      if (!response.ok) {
        if (response.status === 400) {
          return sendError(res, 400, "Invalid location provided");
        }
        if (response.status === 401) {
          return sendError(res, 401, "Invalid API key");
        }
        if (response.status === 404) {
          return sendError(res, 404, "Location not found");
        }
        return sendError(res, 500, rawData.error?.message || "Failed to fetch weather data");
      }

      // Process the raw weather data into a more usable format
      let current, location_data;
      try {
        current = rawData.current;
        location_data = rawData.location;
      } catch (error) {
        console.error('Error processing weather data:', error);
        return sendError(res, 500, "Malformed weather data received", error);
      }


      const formattedLocation = `${location_data.country}, ${location_data.name}`;

      
      let imageUrl = null;
      try {
        imageUrl = await weatherModel.getLocationImage(location_data.name, location_data.country);
      } catch (error) {
        console.error('Failed to fetch location image:', error.message);
        imageUrl = null;
      }

      // Get activities with descriptions
      let activitiesWithDescriptions = [];
      try {
        activitiesWithDescriptions = weatherModel.getElderlyActivitiesWithDescriptions({
          condition: current.condition.text,
          temp_c: current.temp_c,
          uv: current.uv
        });
      } catch (error) {
        console.error('Failed to get activities:', error.message);
        activitiesWithDescriptions = [];
      }

      let emoji = '';
      try {
        emoji = weatherModel.getWeatherEmoji(current.condition.text);
      } catch (error) {
        console.error('Failed to get weather emoji:', error.message);
        emoji = '';
      }

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
        emoji: emoji,
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

      return res.status(200).json(weatherData);
    } catch (error) {
      console.error('Weather API error:', error);
      return sendError(res, 500, "Internal server error while fetching weather data", error);
    }
  },

  async searchLocations(req, res) {
    try {
      const q = req.query.q;
      if (!q) {
        return sendError(res, 400, "Search query parameter is required");
      }

      const apiKey = process.env.WEATHER_API_KEY;
      if (!apiKey) {
        return sendError(res, 500, "Weather API key not configured");
      }

      const url = `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${encodeURIComponent(q)}`;
      let response, data;
      
      try {
        response = await fetch(url);
        data = await response.json();
      } catch (error) {
        console.error('Error searching locations:', error);
        return sendError(res, 500, "Failed to search locations from external API", error);
      }

      if (!response.ok) {
        if (response.status === 400) {
          return sendError(res, 400, "Invalid search query");
        }
        if (response.status === 401) {
          return sendError(res, 401, "Invalid API key");
        }
        return sendError(res, 500, "Failed to search locations");
      }

      return sendSuccess(res, 200, "Locations found successfully", data);
    } catch (error) {
      console.error('Search locations error:', error);
      return sendError(res, 500, "Internal server error while searching locations", error);
    }
  }
};