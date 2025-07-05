// Tab switching functionality
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // You can add content switching logic here
        // For example, show/hide different sections based on the active tab
        handleTabSwitch(this.textContent);
    });
});

// Handle tab content switching
function handleTabSwitch(tabName) {
    console.log(`Switched to ${tabName} tab`);
    
    // You can add logic here to show different content based on the tab
    switch(tabName) {
        case 'Weather':
            // Show weather content (already visible)
            break;
        case 'News':
            // Show news content
            console.log('Loading news content...');
            break;
        case 'Alert':
            // Show alert content
            console.log('Loading alert content...');
            break;
    }
}

// Search functionality
function searchWeather() {
    const locationInput = document.getElementById('locationInput');
    const location = locationInput.value.trim();
    
    if (location) {
        // Update location display
        document.querySelector('.location-display span').textContent = location;
        
        // Clear search box
        locationInput.value = '';
        
        // Show loading state
        showLoadingState();
        
        // Simulate API call delay
        setTimeout(() => {
            hideLoadingState();
            // In a real app, you would make an API call here
            updateWeatherData(location);
            showSuccessMessage(`Weather updated for ${location}`);
        }, 1000);
    } else {
        showErrorMessage('Please enter a location');
    }
}

// City background images database
const cityBackgrounds = {
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2052&q=80',
    'chennai': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2088&q=80',
    'paris': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2073&q=80',
    'sydney': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'mumbai': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2088&q=80',
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    'bangkok': 'https://images.unsplash.com/photo-1563492065-1a4a0ac65440?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2115&q=80'
};

// Update weather data and background
function updateWeatherData(location) {
    // Update background image
    updateBackgroundImage(location);
    
    // This is where you would update the weather data from an API
    // For now, we'll just update some dummy data
    
    const temperatures = [25, 28, 30, 32, 35];
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Windy'];
    
    const randomTemp = temperatures[Math.floor(Math.random() * temperatures.length)];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    // Update current temperature
    document.querySelector('.temp-display').innerHTML = `${randomTemp}<span class="temp-unit">°C</span>`;
    
    // Update humidity (random between 40-80%)
    const humidity = Math.floor(Math.random() * 40) + 40;
    document.querySelector('.weather-details div:first-child').textContent = `Humidity: ${humidity}%`;
    
    console.log(`Weather updated for ${location}: ${randomTemp}°C, ${randomCondition}`);
}

// Update background image based on location
function updateBackgroundImage(location) {
    const heroSection = document.querySelector('.hero-section');
    const locationKey = location.toLowerCase();
    
    // Check if we have a background for this city
    if (cityBackgrounds[locationKey]) {
        const imageUrl = cityBackgrounds[locationKey];
        heroSection.style.backgroundImage = `
            linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
            url('${imageUrl}')
        `;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
        
        console.log(`Background updated for ${location}`);
    } else {
        // Use default gradient background if city not found
        heroSection.style.backgroundImage = `
            linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="sunset" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23ff7b7b;stop-opacity:1" /><stop offset="50%" style="stop-color:%23ff6b35;stop-opacity:1" /><stop offset="100%" style="stop-color:%23f7931e;stop-opacity:1" /></linearGradient></defs><rect width="1200" height="800" fill="url(%23sunset)"/><polygon points="0,500 200,450 400,480 600,460 800,490 1000,470 1200,500 1200,800 0,800" fill="%23333"/><circle cx="900" cy="150" r="60" fill="%23ffeb3b" opacity="0.8"/></svg>')
        `;
        
        console.log(`Using default background for ${location}`);
    }
}

// Show loading state
function showLoadingState() {
    const searchBtn = document.querySelector('.search-btn');
    searchBtn.textContent = 'Searching...';
    searchBtn.disabled = true;
    searchBtn.style.opacity = '0.7';
}

// Hide loading state
function hideLoadingState() {
    const searchBtn = document.querySelector('.search-btn');
    searchBtn.textContent = 'Search';
    searchBtn.disabled = false;
    searchBtn.style.opacity = '1';
}

// Show success message
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

// Show error message
function showErrorMessage(message) {
    showMessage(message, 'error');
}

// Show message (generic function)
function showMessage(message, type) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    // Style the message
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: bold;
        font-size: 16px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #4CAF50;' : 'background: #f44336;'}
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 3000);
}

// Enter key support for search
document.addEventListener('DOMContentLoaded', function() {
    const locationInput = document.getElementById('locationInput');
    
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchWeather();
        }
    });
    
    // Add accessibility improvements
    addAccessibilityFeatures();
});

// Add accessibility features
function addAccessibilityFeatures() {
    // Add focus styles for all interactive elements
    document.querySelectorAll('button, input').forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = '3px solid #4a90e2';
            this.style.outlineOffset = '2px';
        });
        
        element.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
    
    // Add keyboard navigation for tabs
    document.querySelectorAll('.nav-tab').forEach((tab, index) => {
        tab.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const tabs = document.querySelectorAll('.nav-tab');
                let nextIndex;
                
                if (e.key === 'ArrowLeft') {
                    nextIndex = index === 0 ? tabs.length - 1 : index - 1;
                } else {
                    nextIndex = index === tabs.length - 1 ? 0 : index + 1;
                }
                
                tabs[nextIndex].focus();
                tabs[nextIndex].click();
            }
        });
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Weather app initialized');
    
    // Set current date
    updateCurrentDate();
    
    // Initialize with default location weather
    // You can uncomment this if you want to load weather data on page load
    // updateWeatherData('Chennai, Tamil Nadu');
});

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', options);
    
    // Update the day info (you might want to add a date element to your HTML)
    console.log('Current date:', dateString);
}