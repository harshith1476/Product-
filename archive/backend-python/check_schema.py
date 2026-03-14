
import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def check_schema():
    print("Checking hospital_tieups table schema...")
    async for db in get_db():
        result = await db.execute(text("SELECT column_name, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'hospital_tieups'"))
        rows = result.fetchall()
        for row in rows:
            print(row)
        break

if __name__ == "__main__":
    asyncio.run(check_schema())
