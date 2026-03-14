
import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def relax_all():
    print("Relaxing ALL constraints on specialties table...")
    async for db in get_db():
        try:
            # Drop availability check
            print("Dropping availability check...")
            await db.execute(text("ALTER TABLE specialties DROP CONSTRAINT IF EXISTS specialties_availability_check"))
            
            # Drop status check (optional but safer)
            print("Dropping status check...")
            await db.execute(text("ALTER TABLE specialties DROP CONSTRAINT IF EXISTS specialties_status_check"))

            await db.commit()
            print("✅ Constraints relaxed.")
        except Exception as e:
            print(f"❌ Failed: {e}")
        break

if __name__ == "__main__":
    asyncio.run(relax_all())
