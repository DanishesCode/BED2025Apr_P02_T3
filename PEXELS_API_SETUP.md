# 🖼️ Pexels API Setup Guide

## 📋 Quick Setup Instructions

### 1. Get Your FREE Pexels API Key
1. Go to [Pexels API](https://www.pexels.com/api/)
2. Click "Get Started" 
3. Sign up with your email (it's free!)
4. Once logged in, you'll see your API key

### 2. Configure Your API Key
Replace the placeholder in `models/weatherModel.js`:

```javascript
// Find this line (around line 8):
this.pexelsApiKey = 'ENTER_YOUR_PEXELS_API_KEY_HERE';

// Replace with your actual key:
this.pexelsApiKey = 'YOUR_ACTUAL_PEXELS_API_KEY';
```

## 🎯 What You'll Get

✅ **Relevant Images**: Real photos of Singapore locations
✅ **High Quality**: Professional photography from Pexels
✅ **Free Tier**: 200 requests per hour (plenty for testing)
✅ **Automatic Fallback**: Curated images if API fails

## 🔄 Current Fallback System

Even without the API key, you'll get:
- High-quality Singapore images for major locations
- Smart keyword-based image selection
- Reliable fallback system

## 📊 API Limits

- **Free Tier**: 200 requests/hour
- **Rate Limiting**: Built-in delays between requests
- **Fallback Protection**: Graceful degradation if limits exceeded

## 🛠️ Troubleshooting

**Issue**: Images still not showing
**Solution**: Check browser console for error messages

**Issue**: API key not working  
**Solution**: Verify the key is correct and account is active

**Issue**: Rate limit exceeded
**Solution**: The app will automatically use fallback images
