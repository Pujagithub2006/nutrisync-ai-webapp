#!/usr/bin/env python3
"""
Test the Python API endpoints
"""

import asyncio
import sys
import os
import aiohttp
import json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_api():
    """Test the API endpoints"""
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        # Test health endpoint
        print("🔍 Testing health endpoint...")
        async with session.get(f"{base_url}/health") as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Health: {data}")
            else:
                print(f"❌ Health failed: {response.status}")
        
        # Test physiology sync endpoint
        print("\n🔍 Testing physiology sync...")
        payload = {
            "heart_rate_bpm": 75,
            "hrv_ms": 65,
            "spo2": 97,
            "sleep_hours": 7.5,
            "steps": 8500,
            "active_calories": 2200,
            "stress_score": 5
        }
        
        async with session.post(
            f"{base_url}/v1/physiology/sync",
            json=payload,
            headers={"Authorization": "Bearer test-user-123"}
        ) as response:
            if response.status == 201:
                data = await response.json()
                print(f"✅ Physiology sync: {json.dumps(data, indent=2)}")
            else:
                text = await response.text()
                print(f"❌ Physiology sync failed: {response.status}")
                print(f"Response: {text}")
        
        # Test today's data endpoint
        print("\n🔍 Testing today's data...")
        async with session.get(
            f"{base_url}/v1/physiology/today",
            headers={"Authorization": "Bearer test-user-123"}
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Today's data: {json.dumps(data, indent=2)}")
            else:
                text = await response.text()
                print(f"❌ Today's data failed: {response.status}")
                print(f"Response: {text}")

if __name__ == "__main__":
    asyncio.run(test_api())
