import aiohttp
import asyncio

async def test_python():
    try:
        headers = {'Authorization': 'Bearer test-user-123'}
        async with aiohttp.ClientSession() as session:
            async with session.get('http://localhost:8000/v1/physiology/today', headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Python backend working:")
                    print(f"📊 Heart Rate: {data.get('heart_rate_bpm')}")
                    print(f"🧠 HRV: {data.get('hrv_ms')}")
                    print(f"🫁 SpO2: {data.get('spo2')}")
                    print(f"👟 Steps: {data.get('steps')}")
                else:
                    print(f"❌ Python backend failed: {response.status}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_python())
