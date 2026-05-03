#!/usr/bin/env python3
"""
Sync existing Firebase user to MySQL database
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import AsyncSessionLocal
from app.models.models import User
from sqlalchemy import select

async def sync_user():
    """Sync the existing Firebase user to SQL"""
    async with AsyncSessionLocal() as session:
        # Check if user already exists
        result = await session.execute(
            select(User).where(User.firebase_uid == "test-user-123")
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print("✅ User already exists in SQL database")
            print(f"📊 User ID: {existing_user.user_id}")
            print(f"📧 Email: {existing_user.email}")
            print(f"👤 Name: {existing_user.display_name}")
            return existing_user
        
        # Create new user
        new_user = User(
            firebase_uid="test-user-123",
            email="test@nutrisense.app",
            display_name="Test User",
            age=30,
            gender="other",
            height_cm=175,
            weight_kg=70,
            activity_level="active",
            diet_type="omnivore",
            primary_goal="general_health"
        )
        
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        
        print("✅ Successfully synced Firebase user to SQL database")
        print(f"📊 User ID: {new_user.user_id}")
        print(f"📧 Email: {new_user.email}")
        print(f"👤 Name: {new_user.display_name}")
        
        return new_user

if __name__ == "__main__":
    asyncio.run(sync_user())
