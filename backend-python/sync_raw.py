
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

# Manual settings since we can't import easily
DB_URL = "postgresql+asyncpg://postgres:Javali786@localhost:5432/healthsystem_pg"

async def sync():
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        # Get all doctors
        res = await conn.execute(text("SELECT name, email FROM hospital_tieup_doctors WHERE email IS NOT NULL"))
        doctors = res.fetchall()
        
        print(f"Syncing {len(doctors)} doctors...")
        for name, email in doctors:
            # Check if user exists
            u_res = await conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
            user = u_res.fetchone()
            
            if not user:
                print(f"Creating user for {email}")
                # We'll use a default hashed password (medichain123)
                # This hash is for 'medichain123'
                from passlib.context import CryptContext
                pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                hashed = pwd_context.hash("medichain123")
                
                await conn.execute(
                    text("INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (:name, :email, :password, 'doctor', NOW(), NOW())"),
                    {"name": name, "email": email, "password": hashed}
                )
            else:
                print(f"Updating user for {email}")
                await conn.execute(
                    text("UPDATE users SET role = 'doctor' WHERE email = :email"),
                    {"email": email}
                )
    print("Sync complete")

if __name__ == "__main__":
    asyncio.run(sync())
