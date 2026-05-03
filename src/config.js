// src/config.js
const isProduction = process.env.NODE_ENV === 'production';

export const API_BASE_URL = isProduction 
  ? 'https://nutrisync-ai-8n3c.onrender.com'
  : 'http://localhost:5000';
