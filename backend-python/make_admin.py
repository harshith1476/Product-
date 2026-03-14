
import asyncio
from sqlalchemy import text
from app.db.session import get_db

async def make_admin(email: str):
    print(f"Making {email} an Admin...")
    async for db in get_db():
        try:
            # Update role to admin
            await db.execute(
                text("UPDATE users SET role = 'admin' WHERE email = :email"),
                {"email": email}
            )
            await db.commit()
            
            # Verify
            result = await db.execute(
                text("SELECT role FROM users WHERE email = :email"),
                {"email": email}
            )
            role = result.scalar()
            print(f"✅ User {email} is now: {role}")
            
        except Exception as e:
            print(f"❌ Failed to update role: {e}")
        break

if __name__ == "__main__":
    asyncio.run(make_admin("testuser@example.com"))
