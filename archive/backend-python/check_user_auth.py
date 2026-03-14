
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, name, email, role, password FROM users WHERE email = '231fa04e20@gmail.com'"))
        user = res.fetchone()
        if user:
            print(f"User: {user[1]}, Email: {user[2]}, Role: {user[3]}, PassHash: {user[4][:20]}...")
            
            # Verify password again
            from app.core.security import verify_password
            plain = "jfDEBsJNnT"
            match = verify_password(plain, user[4])
            print(f"Password 'jfDEBsJNnT' matches: {match}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(check())
