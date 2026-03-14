
import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def relax_constraints():
    print("Relaxing constraints on specialties table...")
    async for db in get_db():
        try:
            # Make helpline_number nullable
            await db.execute(text("ALTER TABLE specialties ALTER COLUMN helpline_number DROP NOT NULL"))
            await db.commit()
            print("✅ helpline_number is now nullable.")
        except Exception as e:
            print(f"❌ Failed: {e}")
        break

if __name__ == "__main__":
    asyncio.run(relax_constraints())
