
import asyncio
from sqlalchemy import text
from app.db.session import SessionLocal

async def fix_appointments_session():
    print("Adding 'session' column to appointments table...")
    async with SessionLocal() as db:
        try:
            # We add it as nullable first to avoid errors with existing data
            await db.execute(text("ALTER TABLE appointments ADD COLUMN session VARCHAR"))
            print("Column 'session' added successfully.")
            
            # Now we need to populate it for existing rows if we want it to be NOT NULL
            # For now, let's just make it nullable or set a default
            await db.execute(text("UPDATE appointments SET session = 'Morning' WHERE session IS NULL"))
            
            # Make it nullable=False if desired
            # await db.execute(text("ALTER TABLE appointments ALTER COLUMN session SET NOT NULL"))
            
            await db.commit()
            print("Database committed.")
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(fix_appointments_session())
