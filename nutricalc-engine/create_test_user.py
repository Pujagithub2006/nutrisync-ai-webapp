#!/usr/bin/env python3
"""
Create a test user in the database
"""

import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.models import User

async def create_test_user():
    """Create a test user for testing"""
    async with AsyncSessionLocal() as session:
        try:
            # Check if user already exists
            from sqlalchemy import select
            result = await session.execute(
                select(User).where(User.firebase_uid == "test-user-123")
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print("✅ Test user already exists!")
                return
            
            # Create new test user with valid enum values
            test_user = User(
                user_id=uuid.uuid4(),
                firebase_uid="test-user-123",
                email="test@nutrisense.app",
                display_name="Test User",
                age=30,
                gender="other",
                height_cm=175.0,
                weight_kg=70.0,
                activity_level="active",  # Changed to valid enum value
                primary_goal="general_health"
            )
            
            session.add(test_user)
            await session.commit()
            print("✅ Test user created successfully!")
            print(f"User ID: {test_user.user_id}")
            print(f"Firebase UID: {test_user.firebase_uid}")
            
        except Exception as e:
            print(f"❌ Error creating test user: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(create_test_user())
