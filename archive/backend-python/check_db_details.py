
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check_schema():
    async with engine.connect() as conn:
        print("--- USERS TABLE ---")
        result = await conn.execute(text("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'users'"))
        for row in result.fetchall():
            print(row)
            
        print("\n--- DOCTORS TABLE ---")
        result = await conn.execute(text("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'hospital_tieup_doctors'"))
        for row in result.fetchall():
            print(row)

if __name__ == "__main__":
    asyncio.run(check_schema())
