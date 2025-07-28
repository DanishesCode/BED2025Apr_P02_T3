# 🖼️ Pexels API Setup Guide

## 📸 Get Your FREE Pexels API Key

### 1. Get Your FREE Pexels API Key
1. Go to [Pexels API](https://www.pexels.com/api/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Set Up Environment Variable
Add your API key to your `.env` file:

```env
PEXELS_API_KEY=your_actual_pexels_api_key_here
```

### 3. Features
- ✅ **High Quality**: Professional photography from Pexels
- ✅ **Free Tier**: 200 requests per hour
- ✅ **Landscape Images**: Perfect for weather app backgrounds
- ✅ **Multiple Keywords**: Searches for city, country, landscape, architecture

### 4. How It Works
The system searches for images using these keywords:
1. `City Country` (e.g., "Singapore Singapore")
2. `City city` (e.g., "London city")
3. `Country landscape` (e.g., "Japan landscape")
4. `Country architecture` (e.g., "France architecture")

### 5. Example Usage
```javascript
// Automatically fetches beautiful images for any location
const imageUrl = await weatherModel.getLocationImage("Singapore", "Singapore");
// Returns: https://images.pexels.com/photos/...
```

## 🚀 Ready to Use!
Once you add your Pexels API key to the `.env` file, the weather app will automatically display beautiful location-specific images! 