
import asyncio
from sqlalchemy import text
from app.db.session import SessionLocal

async def fix():
    print("Fixing appointments table schema...")
    async with SessionLocal() as db:
        try:
            # Make columns nullable that we don't necessarily provide yet
            print("Making user_data and doctor_data nullable...")
            await db.execute(text("ALTER TABLE appointments ALTER COLUMN user_data DROP NOT NULL"))
            await db.execute(text("ALTER TABLE appointments ALTER COLUMN doctor_data DROP NOT NULL"))
            
            print("Making 'date' nullable...")
            await db.execute(text("ALTER TABLE appointments ALTER COLUMN date DROP NOT NULL"))
            
            # Ensure slot_date, slot_time, session, token_number are NOT NULL as expected by model
            # print("Ensuring slot columns are NOT NULL...")
            # await db.execute(text("ALTER TABLE appointments ALTER COLUMN slot_date SET NOT NULL"))
            # await db.execute(text("ALTER TABLE appointments ALTER COLUMN slot_time SET NOT NULL"))
            # await db.execute(text("ALTER TABLE appointments ALTER COLUMN session SET NOT NULL"))
            
            # Ensure user_id and doctor_id are NOT NULL
            print("Ensuring user_id and doctor_id are NOT NULL...")
            await db.execute(text("ALTER TABLE appointments ALTER COLUMN user_id SET NOT NULL"))
            await db.execute(text("ALTER TABLE appointments ALTER COLUMN doctor_id SET NOT NULL"))

            await db.commit()
            print("Successfully updated appointments table schema.")
        except Exception as e:
            print(f"Error during migration: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(fix())
