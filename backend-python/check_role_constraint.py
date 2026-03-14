
import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def check():
    async for db in get_db():
        result = await db.execute(text("SELECT * FROM information_schema.constraint_column_usage WHERE table_name = 'users' AND column_name = 'role'"))
        constraint = result.fetchone()
        if constraint:
            print(f"Role constraint found: {constraint}")
            
            # Get details
            check = await db.execute(text(f"SELECT check_clause FROM information_schema.check_constraints WHERE constraint_name = '{constraint.constraint_name}'"))
            clause = check.scalar()
            print(f"Check clause: {clause}")
        else:
            print("No constraint found on role column")
        break

if __name__ == "__main__":
    asyncio.run(check())
