
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def health_check():
    async with engine.connect() as conn:
        print("Checking tables...")
        for table in ["users", "hospital_tieups", "hospital_tieup_doctors", "appointments"]:
            try:
                res = await conn.execute(text(f"SELECT count(*) FROM {table}"))
                count = res.scalar()
                print(f"Table {table}: {count} rows")
            except Exception as e:
                print(f"Table {table}: ERROR - {e}")

if __name__ == "__main__":
    asyncio.run(health_check())
