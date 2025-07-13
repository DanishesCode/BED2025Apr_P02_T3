const fetch = require('node-fetch');

const weatherApiController = {
    /**
     * Get weather data for a location
     */
    async getWeather(req, res) {
        try {
            const { location } = req.query;
            
            if (!location) {
                return res.status(400).json({
                    success: false,
                    error: 'Location parameter is required'
                });
            }

            const apiKey = process.env.WEATHER_API_KEY;
            if (!apiKey) {
                console.error('WEATHER_API_KEY not found in environment variables');
                return res.status(500).json({
                    success: false,
                    error: 'Weather service configuration error'
                });
            }

            // Fetch current weather and forecast
            const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=7&aqi=yes&alerts=yes`;
            
            console.log(`🌤️ Fetching weather for: ${location}`);
            
            const response = await fetch(weatherUrl);
            const data = await response.json();

            if (!response.ok) {
                console.error('Weather API error:', data);
                return res.status(400).json({
                    success: false,
                    error: data.error?.message || 'Failed to fetch weather data'
                });
            }

            // Format the response
            const formattedData = {
                location: {
                    name: data.location.name,
                    region: data.location.region,
                    country: data.location.country,
                    lat: data.location.lat,
                    lon: data.location.lon,
                    localtime: data.location.localtime
                },
                current: {
                    temp_c: data.current.temp_c,
                    temp_f: data.current.temp_f,
                    condition: {
                        text: data.current.condition.text,
                        icon: data.current.condition.icon
                    },
                    wind_mph: data.current.wind_mph,
                    wind_kph: data.current.wind_kph,
                    wind_dir: data.current.wind_dir,
                    pressure_mb: data.current.pressure_mb,
                    humidity: data.current.humidity,
                    cloud: data.current.cloud,
                    feelslike_c: data.current.feelslike_c,
                    feelslike_f: data.current.feelslike_f,
                    vis_km: data.current.vis_km,
                    uv: data.current.uv,
                    gust_mph: data.current.gust_mph,
                    gust_kph: data.current.gust_kph
                },
                forecast: data.forecast.forecastday.map(day => ({
                    date: day.date,
                    day: {
                        maxtemp_c: day.day.maxtemp_c,
                        maxtemp_f: day.day.maxtemp_f,
                        mintemp_c: day.day.mintemp_c,
                        mintemp_f: day.day.mintemp_f,
                        avgtemp_c: day.day.avgtemp_c,
                        avgtemp_f: day.day.avgtemp_f,
                        condition: {
                            text: day.day.condition.text,
                            icon: day.day.condition.icon
                        },
                        maxwind_mph: day.day.maxwind_mph,
                        maxwind_kph: day.day.maxwind_kph,
                        avghumidity: day.day.avghumidity,
                        daily_will_it_rain: day.day.daily_will_it_rain,
                        daily_chance_of_rain: day.day.daily_chance_of_rain,
                        daily_will_it_snow: day.day.daily_will_it_snow,
                        daily_chance_of_snow: day.day.daily_chance_of_snow,
                        uv: day.day.uv
                    },
                    astro: {
                        sunrise: day.astro.sunrise,
                        sunset: day.astro.sunset,
                        moonrise: day.astro.moonrise,
                        moonset: day.astro.moonset,
                        moon_phase: day.astro.moon_phase
                    },
                    hour: day.hour.map(hourData => ({
                        time: hourData.time,
                        temp_c: hourData.temp_c,
                        temp_f: hourData.temp_f,
                        condition: {
                            text: hourData.condition.text,
                            icon: hourData.condition.icon
                        },
                        wind_mph: hourData.wind_mph,
                        wind_kph: hourData.wind_kph,
                        wind_dir: hourData.wind_dir,
                        humidity: hourData.humidity,
                        cloud: hourData.cloud,
                        feelslike_c: hourData.feelslike_c,
                        feelslike_f: hourData.feelslike_f,
                        will_it_rain: hourData.will_it_rain,
                        chance_of_rain: hourData.chance_of_rain,
                        will_it_snow: hourData.will_it_snow,
                        chance_of_snow: hourData.chance_of_snow,
                        vis_km: hourData.vis_km,
                        gust_mph: hourData.gust_mph,
                        gust_kph: hourData.gust_kph,
                        uv: hourData.uv
                    }))
                }))
            };

            // Add air quality if available
            if (data.current.air_quality) {
                formattedData.current.air_quality = data.current.air_quality;
            }

            // Add alerts if available
            if (data.alerts && data.alerts.alert && data.alerts.alert.length > 0) {
                formattedData.alerts = data.alerts.alert;
            }

            console.log(`✅ Weather data fetched successfully for: ${formattedData.location.name}`);

            res.json({
                success: true,
                data: formattedData
            });

        } catch (error) {
            console.error('Weather API Controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error while fetching weather data'
            });
        }
    },

    /**
     * Search for locations
     */
    async searchLocations(req, res) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query parameter is required'
                });
            }

            const apiKey = process.env.WEATHER_API_KEY;
            if (!apiKey) {
                return res.status(500).json({
                    success: false,
                    error: 'Weather service configuration error'
                });
            }

            const searchUrl = `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${encodeURIComponent(q)}`;
            
            const response = await fetch(searchUrl);
            const data = await response.json();

            if (!response.ok) {
                return res.status(400).json({
                    success: false,
                    error: 'Failed to search locations'
                });
            }

            res.json({
                success: true,
                data: data
            });

        } catch (error) {
            console.error('Location search error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error while searching locations'
            });
        }
    }
};

module.exports = weatherApiController;
