
import asyncio
from sqlalchemy import text
from app.db.session import SessionLocal

async def check():
    async with SessionLocal() as db:
        res = await db.execute(text("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'appointments' AND column_name IN ('session', 'token_number')"))
        rows = res.fetchall()
        for name, nullable, default in rows:
            print(f"{name}|{nullable}|{default}")

if __name__ == "__main__":
    asyncio.run(check())
