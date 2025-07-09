// Main Weather App Initialization
// This file initializes the weather application and sets up global instances

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the weather controller
    window.weatherController = new WeatherController();
    
    // Initialize the app with default location (Singapore)
    window.weatherController.init('Singapore');
    
    console.log('Weather App initialized successfully!');
});

// Global functions for backward compatibility with existing HTML
window.searchWeather = function(defaultLocation = "") {
    if (window.weatherController) {
        window.weatherController.searchWeather(defaultLocation);
    }
};

// Error handling for uncaught errors
window.addEventListener('error', function(e) {
    console.error('Weather App Error:', e.error);
    // You could send this to an error reporting service
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
    e.preventDefault(); // Prevent the default handling
});
