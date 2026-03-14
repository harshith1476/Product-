
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def list_docs():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT name, email, role FROM users WHERE role = 'doctor'"))
        for row in res.fetchall():
            print(f"Name: {row[0]}, Email: {row[1]}, Role: {row[2]}")

if __name__ == "__main__":
    asyncio.run(list_docs())
