
import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def update_constraint():
    print("Updating role constraint...")
    async for db in get_db():
        try:
            # Drop old constraint
            print("Dropping old constraint...")
            await db.execute(text("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check"))
            
            # Add new constraint
            print("Adding new constraint...")
            await db.execute(text("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('patient', 'doctor', 'admin'))"))
            
            await db.commit()
            print("✅ Constraint updated successfully!")
            
        except Exception as e:
            print(f"❌ Failed to update constraint: {e}")
        break

if __name__ == "__main__":
    asyncio.run(update_constraint())
