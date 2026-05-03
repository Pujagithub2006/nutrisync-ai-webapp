// ─── api.js ───────────────────────────────────────────────────────
// Centralized API service for NutriSync

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:5000';

export async function calculatePhysiology(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/physiology`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Physiology API error:", error);
    // Return default values on error
    return {
      bmr: 1500,
      tdee: 2200,
      recommended_calories: 2000,
      status: 'error',
      message: error.message
    };
  }
}

export async function fetchVitals() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/vitals`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Vitals API error:", error);
    return null;
  }
}

export async function getAIRecommendation(prompt) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("AI API error:", error);
    return { content: [{ text: "AI service unavailable. Please try again later." }] };
  }
}