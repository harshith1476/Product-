
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
import sys

# Ensure we can import from app
sys.path.append(os.getcwd())

from app.core.security import verify_password, get_password_hash
from app.db.session import engine

async def check_passwords():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT name, email, password FROM users WHERE role = 'doctor'"))
        doctors = res.fetchall()
        
        print(f"Checking {len(doctors)} doctors...")
        for name, email, hashed in doctors:
            is_default = verify_password("medichain123", hashed)
            status = "DEFAULT (medichain123)" if is_default else "CUSTOM"
            print(f"Doctor: {name} ({email}) - Password: {status}")

if __name__ == "__main__":
    asyncio.run(check_passwords())
