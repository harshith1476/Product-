
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DB_URL = "postgresql+asyncpg://postgres:Javali786@localhost:5432/healthsystem_pg"

async def check():
    engine = create_async_engine(DB_URL)
    async with engine.connect() as conn:
        print("--- USERS ---")
        res = await conn.execute(text("SELECT id, name, email, role FROM users WHERE role = 'doctor'"))
        users = res.fetchall()
        for u in users:
            print(f"User: ID={u[0]}, Name={u[1]}, Email={u[2]}, Role={u[3]}")
            
        print("\n--- DOCTOR PROFILES ---")
        res = await conn.execute(text("SELECT id, name, email FROM hospital_tieup_doctors"))
        docs = res.fetchall()
        for d in docs:
            print(f"Profile: ID={d[0]}, Name={d[1]}, Email={d[2] or 'MISSING'}")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
