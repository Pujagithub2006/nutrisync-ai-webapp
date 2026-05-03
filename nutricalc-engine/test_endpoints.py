#!/usr/bin/env python3
"""
Test endpoint without classify_state
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timezone

async def test_direct_db():
    """Test direct database insertion"""
    
    # Test the health endpoint first
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-user-123"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            # Test health endpoint
            async with session.get("http://localhost:8000/health") as response:
                print(f"Health check: {response.status}")
                if response.status == 200:
                    result = await response.json()
                    print(f"Health response: {result}")
                else:
                    print("Health check failed")
                    return
            
            # Test a simple GET endpoint that doesn't require complex logic
            async with session.get(
                "http://localhost:8000/v1/physiology/today",
                headers=headers
            ) as response:
                print(f"Today endpoint: {response.status}")
                if response.status == 404:
                    print("✅ Today endpoint works (404 expected for no data)")
                elif response.status == 200:
                    result = await response.json()
                    print(f"Today response: {result}")
                else:
                    error_text = await response.text()
                    print(f"❌ Today endpoint error: {response.status}")
                    print(f"Details: {error_text}")
                    
        except Exception as e:
            print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    asyncio.run(test_direct_db())
