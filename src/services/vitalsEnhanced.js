// ─── vitalsEnhanced.js ────────────────────────────────────────────────
// Enhanced vitals service - fetches from Node backend

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:5000';

function getBaseHR() {
  const h = new Date().getHours();
  if (h >= 6 && h < 9)   return 78;
  if (h >= 9 && h < 12)  return 72;
  if (h >= 12 && h < 14) return 75;
  if (h >= 14 && h < 17) return 70;
  if (h >= 17 && h < 20) return 80;
  return 65;
}

function getBaseSteps() {
  const h = new Date().getHours();
  const base = Math.floor(h * 480);
  return base + Math.floor(Math.random() * 200);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function useVitalsEnhanced() {
  const [vitals, setVitals] = useState({
    hr:     Math.round(getBaseHR()),
    spo2:   97,
    hrv:    65,
    stress: 'Moderate',
    activity: 'Moderately Active',
    steps:   getBaseSteps(),
    calories: 1800,
    sleep:    7.5,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let intervalId = null;

    async function fetchVitals() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/vitals`);
        
        if (response.ok) {
          const data = await response.json();
          setVitals({
            hr: Math.min(200, Math.max(40, Math.round(data.heart_rate_bpm || getBaseHR()))),
            spo2: Math.min(100, Math.max(90, parseFloat((data.spo2 || 97).toFixed(1)))),
            hrv: Math.min(120, Math.max(20, parseFloat((data.hrv_ms || 65).toFixed(1)))),
            stress: data.physio_state === 'high' ? 'High' : data.physio_state === 'low' ? 'Low' : 'Moderate',
            activity: 'Moderately Active',
            steps: Math.max(0, data.steps || getBaseSteps()),
            calories: Math.max(0, data.active_calories || 1800),
            sleep: Math.min(24, Math.max(0, parseFloat((data.sleep_hours || 7.5).toFixed(1)))),
          });
          setError(null);
        } else {
          // Use simulated data if API fails
          updateSimulatedData();
        }
      } catch (err) {
        console.warn('Failed to fetch vitals, using simulated:', err);
        updateSimulatedData();
      } finally {
        setLoading(false);
      }
    }

    function updateSimulatedData() {
      setVitals(prev => ({
        ...prev,
        hr: Math.round(clamp(prev.hr + (Math.random() - 0.5) * 4, 55, 100)),
        spo2: parseFloat(clamp(prev.spo2 + (Math.random() - 0.5) * 2, 94, 100).toFixed(1)),
        hrv: parseFloat(clamp(prev.hrv + (Math.random() - 0.5) * 8, 20, 120).toFixed(1)),
        steps: prev.steps + Math.floor(Math.random() * 50),
        calories: prev.calories + Math.floor(Math.random() * 20),
      }));
    }

    // Initial fetch
    fetchVitals();

    // Update every 10 seconds
    intervalId = setInterval(fetchVitals, 10000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return {
    vitals,
    loading,
    error,
  };
}