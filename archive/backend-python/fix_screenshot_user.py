
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
import sys

# Ensure we can import from app
sys.path.append(os.getcwd())

from app.core.security import get_password_hash
from app.db.session import engine

async def fix_specific():
    async with engine.begin() as conn:
        # Fix for the user in the latest screenshot
        email = "231fa04e20@gmail.com"
        password = "jfDEBsJNnT"
        name = "Dr. Anjali Rao"
        
        print(f"Fixing credentials for {email}...")
        hashed = get_password_hash(password)
        
        # Check if user exists
        res = await conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email})
        user = res.fetchone()
        
        if not user:
            print(f"User {email} not found, creating...")
            await conn.execute(text("""
                INSERT INTO users (name, email, password, role, created_at, updated_at)
                VALUES (:name, :email, :password, 'doctor', NOW(), NOW())
            """), {"name": name, "email": email, "password": hashed})
        else:
            print(f"Updating password for {email}...")
            await conn.execute(text("UPDATE users SET password = :password, role = 'doctor' WHERE email = :email"), 
                               {"email": email, "password": hashed})
            
        # Also ensure profile exists
        res = await conn.execute(text("SELECT id FROM hospital_tieup_doctors WHERE email = :email"), {"email": email})
        if not res.fetchone():
            print(f"Creating profile for {email}...")
            # Get a hospital ID
            h_res = await conn.execute(text("SELECT id FROM hospital_tieups LIMIT 1"))
            h_id = h_res.scalar()
            await conn.execute(text("""
                INSERT INTO hospital_tieup_doctors 
                (hospital_tieup_id, name, email, qualification, specialization, experience, available, show_on_hospital_page, created_at, updated_at)
                VALUES (:h_id, :name, :email, 'MBBS', 'General Physician', '1 Year', True, True, NOW(), NOW())
            """), {"h_id": h_id, "name": name, "email": email})

    print("Success: Credentials updated.")

if __name__ == "__main__":
    asyncio.run(fix_specific())
