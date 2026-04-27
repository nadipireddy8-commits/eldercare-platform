// frontend/js/config.js
// THIS IS IMPORTANT - Set your live backend URL here

// ============================================
// CHANGE THIS TO YOUR LIVE BACKEND URL
// ============================================
const LIVE_BACKEND_URL = 'https://eldercare-api-4ovh.onrender.com/api';

// For local development
const LOCAL_BACKEND_URL = 'http://localhost:5001/api';

// Auto-detect which URL to use
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

const API_URL = isLocalhost ? LOCAL_BACKEND_URL : LIVE_BACKEND_URL;

// Make it available globally
window.API_CONFIG = {
    BASE_URL: API_URL
};

console.log('🌐 Environment:', isLocalhost ? 'Local Development' : 'Production');
console.log('🔗 API URL:', API_URL);