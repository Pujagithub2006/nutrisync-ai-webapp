#!/usr/bin/env python3
"""
Minimal test to check database insertion
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timezone

async def test_minimal_payload():
    """Test with minimal payload"""
    
    # Try with minimal required fields
    payload = {
        "heart_rate_bpm": 75,
        "sleep_hours": 7.5,
        "steps": 12000,
        "source": "test",
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
                print(f"Status: {response.status}")
                if response.status == 201:
                    result = await response.json()
                    print("✅ Success!")
                    print(f"Response: {json.dumps(result, indent=2)}")
                else:
                    error_text = await response.text()
                    print(f"❌ Error: {response.status}")
                    print(f"Details: {error_text}")
                    
        except Exception as e:
            print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_minimal_payload())
