const fetch = require('node-fetch');

const weatherModel = {
  async getLocationImage(locationName, countryName) {
    try {
      // Manual override for Singapore with a beautiful image
      if (locationName.toLowerCase() === 'singapore' && countryName.toLowerCase() === 'singapore') {
        return 'https://images.unsplash.com/photo-1506351421178-63b52a2d2562?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';
      }
      
      const apiKey = process.env.PEXELS_API_KEY;
      if (!apiKey) return null;
      
      const keywords = [
        `${locationName} ${countryName}`,
        `${locationName} city`,
        `${countryName} landscape`,
        `${countryName} architecture`
      ];
      
      for (const keyword of keywords) {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&orientation=landscape`, {
          headers: { 'Authorization': apiKey }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            const photo = data.photos[0];
            return photo.src.large2x || photo.src.large || photo.src.medium;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('getLocationImage error:', error);
      return null;
    }
  },

  // Utility: Get weather emoji
  getWeatherEmoji(condition) {
    try {
      const conditionLower = condition.toLowerCase();
      if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return '☀️';
      if (conditionLower.includes('partly cloudy') || conditionLower.includes('partly sunny')) return '⛅';
      if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) return '☁️';
      if (conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('shower')) return '🌦️';
      if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return '⛈️';
      if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) return '❄️';
      if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) return '🌫️';
      if (conditionLower.includes('wind')) return '💨';
      return '🌤️';
    } catch (error) {
      console.error('getWeatherEmoji error:', error);
      return '🌤️';
    }
  },

  // Utility: Get activity recommendations (simple version)
  getElderlyActivities(weatherData) {
    try {
      const condition = weatherData.condition.toLowerCase();
      const temp = weatherData.temp_c;
      const uv = weatherData.uv;
      let activities = [];
      
      if ((condition.includes('sunny') || condition.includes('clear')) && temp >= 15 && temp <= 25 && uv <= 6) {
        activities = ['Morning walk', 'Outdoor gardening', 'Porch reading'];
      } else if (temp > 25 || uv > 6) {
        activities = ['Indoor light exercises', 'Hydration & rest', 'Early morning activities'];
      } else if (temp >= 5 && temp < 15) {
        activities = ['Warm indoor activities', 'Short outdoor walks'];
      } else if (temp < 5) {
        activities = ['Stay indoors & keep warm', 'Indoor exercise & stretching'];
      } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('overcast') || condition.includes('cloudy')) {
        activities = ['Cozy indoor day', 'Creative indoor activities'];
      } else {
        activities = ['Enjoy the pleasant weather', 'Light outdoor activity'];
      }
      return activities;
    } catch (error) {
      console.error('getElderlyActivities error:', error);
      return ['General indoor activities'];
    }
  },

  // Utility: Get activity recommendations with descriptions
  getElderlyActivitiesWithDescriptions(weatherData) {
    try {
      console.log('getElderlyActivitiesWithDescriptions called with:', weatherData);
      
      const condition = weatherData.condition.toLowerCase();
      const temp = weatherData.temp_c;
      const uv = weatherData.uv;
      let activities = [];

      console.log('Processing weather data - condition:', condition, 'temp:', temp, 'uv:', uv);

      if ((condition.includes('sunny') || condition.includes('clear')) && temp >= 15 && temp <= 25 && uv <= 6) {
        activities = [
          {
            title: 'Morning Walk',
            description: 'Perfect weather for a gentle stroll. Take a 15-20 minute walk in the early morning.',
            icon: '🚶'
          },
          {
            title: 'Outdoor Gardening',
            description: 'Great conditions for light gardening. Water plants and tend to your garden.',
            icon: '🌱'
          },
          {
            title: 'Porch Reading',
            description: 'Enjoy reading outside in the pleasant weather. Find a comfortable spot.',
            icon: '📚'
          }
        ];
        console.log('Selected sunny/clear activities');
      } else if (temp > 25 || uv > 6) {
        activities = [
          {
            title: 'Indoor Light Exercises',
            description: 'Stay cool indoors with gentle stretching and yoga exercises.',
            icon: '🧘'
          },
          {
            title: 'Hydration & Rest',
            description: 'Stay well-hydrated and take frequent breaks during peak heat.',
            icon: '💧'
          },
          {
            title: 'Early Morning Activities',
            description: 'Plan outdoor activities for early morning when temperatures are cooler.',
            icon: '🌅'
          }
        ];
        console.log('Selected hot weather activities');
      } else if (temp >= 5 && temp < 15) {
        activities = [
          {
            title: 'Warm Indoor Activities',
            description: 'Enjoy cozy indoor activities like knitting, puzzles, or board games.',
            icon: '🏠'
          },
          {
            title: 'Short Outdoor Walks',
            description: 'Take brief walks during the warmest part of the day. Dress in layers.',
            icon: '🚶'
          },
          {
            title: 'Indoor Exercise & Stretching',
            description: 'Maintain mobility with indoor exercises and stretching.',
            icon: '🧘'
          }
        ];
        console.log('Selected cool weather activities');
      } else if (temp < 5) {
        activities = [
          {
            title: 'Stay Indoors & Keep Warm',
            description: 'Avoid prolonged outdoor exposure. Keep your home warm and comfortable.',
            icon: '❄️'
          },
          {
            title: 'Indoor Exercise & Stretching',
            description: 'Maintain mobility with indoor exercises and chair yoga.',
            icon: '🧘'
          },
          {
            title: 'Cozy Indoor Activities',
            description: 'Enjoy warm indoor activities like reading, knitting, or watching movies.',
            icon: '🏠'
          }
        ];
        console.log('Selected cold weather activities');
      } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('overcast') || condition.includes('cloudy')) {
        activities = [
          {
            title: 'Cozy Indoor Day',
            description: 'Perfect weather for indoor activities. Read, watch movies, or enjoy hobbies.',
            icon: '☔'
          },
          {
            title: 'Creative Indoor Activities',
            description: 'Try painting, crafting, or other creative pursuits indoors.',
            icon: '🎨'
          },
          {
            title: 'Indoor Exercise & Stretching',
            description: 'Stay active indoors with gentle exercises and stretching.',
            icon: '🧘'
          }
        ];
        console.log('Selected rainy weather activities');
      } else {
        activities = [
          {
            title: 'Enjoy the Pleasant Weather',
            description: 'Take advantage of the comfortable conditions for light outdoor activities.',
            icon: '🌤️'
          },
          {
            title: 'Light Outdoor Activity',
            description: 'Consider gentle outdoor activities like bird watching or short walks.',
            icon: '🌿'
          },
          {
            title: 'Social Indoor Activities',
            description: 'Invite friends or family over for board games or conversation.',
            icon: '👥'
          }
        ];
        console.log('Selected default activities');
      }
      
      console.log('Returning activities:', activities);
      return activities;
    } catch (error) {
      console.error('getElderlyActivitiesWithDescriptions error:', error);
      return [
        {
          title: 'General Activities',
          description: 'Enjoy indoor activities and stay comfortable.',
          icon: '🏠'
        }
      ];
    }
  }
};

module.exports = weatherModel;