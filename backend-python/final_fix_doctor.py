
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
import sys

# Ensure we can import from app
sys.path.append(os.getcwd())

from app.core.security import get_password_hash
from app.db.session import engine

async def fix():
    async with engine.begin() as conn:
        # 1. Expand password column if it's too small
        # Argon2 hashes can be ~100 chars
        print("Expanding password column...")
        await conn.execute(text("ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255)"))
        
        # 2. Add email column to hospital_tieup_doctors if missing (sanity check)
        res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'hospital_tieup_doctors' AND column_name = 'email'"))
        if not res.fetchone():
            print("Adding email column to hospital_tieup_doctors...")
            await conn.execute(text("ALTER TABLE hospital_tieup_doctors ADD COLUMN email VARCHAR(255)"))

        # 3. Create default hospital
        res = await conn.execute(text("SELECT id FROM hospital_tieups LIMIT 1"))
        h_id = res.scalar()
        if not h_id:
            print("Creating hospital...")
            res = await conn.execute(text("INSERT INTO hospital_tieups (name, type, created_at, updated_at) VALUES ('MediChain General Hospital', 'General', NOW(), NOW()) RETURNING id"))
            h_id = res.scalar()

        # 4. Sync Profiles to Users
        print("Syncing profiles to users...")
        res = await conn.execute(text("SELECT name, email FROM hospital_tieup_doctors WHERE email IS NOT NULL"))
        for name, email in res.fetchall():
            u_res = await conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
            if not u_res.fetchone():
                print(f"Creating user for {email}")
                hashed = get_password_hash("medichain123")
                await conn.execute(text("""
                    INSERT INTO users (name, email, password, role, created_at, updated_at)
                    VALUES (:name, :email, :password, 'doctor', NOW(), NOW())
                """), {"name": name, "email": email, "password": hashed})
            else:
                await conn.execute(text("UPDATE users SET role = 'doctor' WHERE email = :email"), {"email": email})

        # 5. Sync Users to Profiles
        print("Syncing users to profiles...")
        res = await conn.execute(text("SELECT name, email FROM users WHERE role = 'doctor'"))
        for name, email in res.fetchall():
            p_res = await conn.execute(text("SELECT id FROM hospital_tieup_doctors WHERE email = :email"), {"email": email})
            if not p_res.fetchone():
                print(f"Creating profile for {email}")
                await conn.execute(text("""
                    INSERT INTO hospital_tieup_doctors 
                    (hospital_tieup_id, name, email, qualification, specialization, experience, available, show_on_hospital_page, created_at, updated_at)
                    VALUES (:h_id, :name, :email, 'MBBS', 'General Physician', '1 Year', True, True, NOW(), NOW())
                """), {"h_id": h_id, "name": name, "email": email})

        # 6. Final fix for the specific doctor
        target_email = "231fa04c93@gmail.com"
        await conn.execute(text("UPDATE users SET name = 'Dr. Arjun Reddy' WHERE email = :email"), {"email": target_email})
        await conn.execute(text("UPDATE hospital_tieup_doctors SET name = 'Dr. Arjun Reddy' WHERE email = :email"), {"email": target_email})

    print("Sync complete.")

if __name__ == "__main__":
    asyncio.run(fix())
