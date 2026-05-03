#!/usr/bin/env python3
"""
Test Google Fit ingestion with a simple endpoint
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timezone

async def test_simple_backend():
    """Test ingestion with a simple payload"""
    
    payload = {
        "heart_rate_bpm": 75,
        "hrv_ms": None,
        "spo2": None,
        "sleep_hours": 7.5,
        "sleep_quality": 8,
        "steps": 12000,
        "active_calories": 450,
        "weight_kg": 70.5,
        "water_ml": None,
        "blood_glucose_mmol": None,
        "stress_score": None,
        "source": "google_fit_script",
        "logged_at": datetime.now(timezone.utc).isoformat()
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-user-123"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                "http://localhost:8000/v1/physiology/sync",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 201:
                    result = await response.json()
                    print("✅ Backend test successful!")
                    print(f"Response: {json.dumps(result, indent=2)}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Backend error: {response.status}")
                    print(f"Error details: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Connection error: {e}")
            return False

if __name__ == "__main__":
    asyncio.run(test_simple_backend())
