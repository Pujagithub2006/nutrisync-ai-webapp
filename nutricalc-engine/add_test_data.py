#!/usr/bin/env python3
"""
Add test physiological data to SQL database
"""

import asyncio
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import AsyncSessionLocal
from app.models.models import PhysiologicalLog, User
from sqlalchemy import select

async def add_test_data():
    """Add test physiological data"""
    async with AsyncSessionLocal() as session:
        # Get the user
        result = await session.execute(
            select(User).where(User.firebase_uid == "test-user-123")
        )
        user = result.scalar_one()
        
        if not user:
            print("❌ User not found")
            return
        
        # Add physiological data
        physio_data = PhysiologicalLog(
            user_id=user.user_id,
            logged_at=datetime.now(timezone.utc),
            heart_rate_bpm=75,
            hrv_ms=65,
            spo2=97,
            sleep_hours=7.5,
            sleep_quality=8,
            steps=8500,
            active_calories=2200,
            weight_kg=70,
            water_ml=2500,
            blood_glucose_mmol=5.2,
            stress_score=30,
            source="manual",
            physio_state="normal"
        )
        
        session.add(physio_data)
        await session.commit()
        
        print("✅ Added test physiological data")
        print(f"❤️ HR: {physio_data.heart_rate_bpm} BPM")
        print(f"🧠 HRV: {physio_data.hrv_ms} ms")
        print(f"🫁 SpO2: {physio_data.spo2}%")
        print(f"😴 Sleep: {physio_data.sleep_hours} hrs")
        print(f"👟 Steps: {physio_data.steps}")
        print(f"🔥 Calories: {physio_data.active_calories}")
        print(f"🩸 Glucose: {physio_data.blood_glucose_mmol} mmol/L")

if __name__ == "__main__":
    asyncio.run(add_test_data())
