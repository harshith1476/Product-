
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings
from app.core.security import get_password_hash

async def fix_user():
    engine = create_async_engine(settings.DATABASE_URL)
    hashed = get_password_hash("9WPmLigREB")
    email = "231fa04c93@gmail.com"
    name = "Dr. Arjun Reddy"
    
    async with engine.begin() as conn:
        # Check if exists
        res = await conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
        user = res.fetchone()
        
        if not user:
            print(f"Inserting user {email}")
            await conn.execute(
                text("INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (:name, :email, :password, 'doctor', NOW(), NOW())"),
                {"name": name, "email": email, "password": hashed}
            )
        else:
            print(f"Updating user {email}")
            await conn.execute(
                text("UPDATE users SET password = :password, role = 'doctor' WHERE email = :email"),
                {"email": email, "password": hashed}
            )
    print("Done")

if __name__ == "__main__":
    asyncio.run(fix_user())
