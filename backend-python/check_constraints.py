
import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def check():
    async for db in get_db():
        result = await db.execute(text("SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE constraint_name LIKE '%hospital_tieup%'"))
        rows = result.fetchall()
        for row in rows:
            print(f"Name: {row.constraint_name}, Clause: {row.check_clause}")
        break

if __name__ == "__main__":
    asyncio.run(check())
