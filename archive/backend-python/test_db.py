
import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def test_db():
    print("Testing DB Connection...")
    async for db in get_db():
        try:
            result = await db.execute(text("SELECT 1"))
            print(f"✅ DB Connection Success: {result.scalar()}")
        except Exception as e:
            print(f"❌ DB Connection Failed: {e}")
        break  # Only need one session

if __name__ == "__main__":
    asyncio.run(test_db())
