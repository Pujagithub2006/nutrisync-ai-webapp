#!/usr/bin/env python3
"""
Create database tables for the NutriCalc backend
"""

import asyncio
from app.core.database import engine
from app.models.models import *  # Import all models to ensure they are registered

async def main():
    """Create all database tables"""
    print("Creating database tables...")
    try:
        async with engine.begin() as conn:
            print(f"Connected to database: {engine.url}")
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Database tables created successfully!")
            
            # List created tables
            result = await conn.execute("SHOW TABLES")
            tables = result.fetchall()
            print(f"Created {len(tables)} tables:")
            for table in tables:
                print(f"  - {table[0]}")
                
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
