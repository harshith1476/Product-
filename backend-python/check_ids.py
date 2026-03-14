
import asyncio
from sqlalchemy import text
from app.db.session import SessionLocal

async def check():
    async with SessionLocal() as db:
        res = await db.execute(text("SELECT id, name, email FROM users"))
        rows = res.fetchall()
        for row in rows:
            print(f"USER:{row[0]}|{row[1]}|{row[2]}")
        
        res = await db.execute(text("SELECT id, name FROM hospital_tieup_doctors"))
        rows = res.fetchall()
        for row in rows:
            print(f"DOCTOR:{row[0]}|{row[1]}")

if __name__ == "__main__":
    asyncio.run(check())
