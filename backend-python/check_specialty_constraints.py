
import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def check():
    async for db in get_db():
        result = await db.execute(text("SELECT * FROM information_schema.constraint_column_usage WHERE table_name = 'specialties'"))
        rows = result.fetchall()
        for row in rows:
            print(f"Constraint: {row}")
            if 'check' in row.constraint_name:
                check = await db.execute(text(f"SELECT check_clause FROM information_schema.check_constraints WHERE constraint_name = '{row.constraint_name}'"))
                clause = check.scalar()
                print(f"  Clause: {clause}")
        break

if __name__ == "__main__":
    asyncio.run(check())
