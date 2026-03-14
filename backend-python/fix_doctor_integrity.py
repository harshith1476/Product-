
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DB_URL = "postgresql+asyncpg://postgres:Javali786@localhost:5432/healthsystem_pg"

async def health_check_and_fix():
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        # 1. Ensure a default hospital exists
        res = await conn.execute(text("SELECT id FROM hospital_tieups LIMIT 1"))
        h_id = res.scalar()
        if not h_id:
            print("Creating default hospital...")
            res = await conn.execute(text("INSERT INTO hospital_tieups (name, type, created_at, updated_at) VALUES ('MediChain General Hospital', 'General', NOW(), NOW()) RETURNING id"))
            h_id = res.scalar()

        # 2. Find doctors who have a User account but NO profile
        print("Finding doctors without profiles...")
        res = await conn.execute(text("""
            SELECT u.id, u.name, u.email 
            FROM users u
            LEFT JOIN hospital_tieup_doctors d ON d.email = u.email
            WHERE u.role = 'doctor' AND d.id IS NULL
        """))
        for u_id, u_name, u_email in res.fetchall():
            print(f"Creating profile for {u_email} ({u_name})")
            await conn.execute(text("""
                INSERT INTO hospital_tieup_doctors 
                (hospital_tieup_id, name, email, qualification, specialization, experience, available, show_on_hospital_page, created_at, updated_at)
                VALUES (:h_id, :name, :email, 'MBBS', 'General Physician', '1 Year', True, True, NOW(), NOW())
            """), {"h_id": h_id, "name": u_name, "email": u_email})

        # 3. Find profiles who have a profile but NO User account
        print("Finding profiles without Users...")
        res = await conn.execute(text("""
            SELECT d.id, d.name, d.email 
            FROM hospital_tieup_doctors d
            LEFT JOIN users u ON u.email = d.email
            WHERE d.email IS NOT NULL AND u.id IS NULL
        """))
        # We need a default password hash. This is for 'medichain123'
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed = pwd_context.hash("medichain123")
        
        for d_id, d_name, d_email in res.fetchall():
            print(f"Creating User for {d_email} ({d_name})")
            await conn.execute(text("""
                INSERT INTO users (name, email, password, role, created_at, updated_at)
                VALUES (:name, :email, :password, 'doctor', NOW(), NOW())
            """), {"name": d_name, "email": d_email, "password": hashed})

        # 4. Specific fix for the user in the screenshot if still broken
        target_email = "231fa04c93@gmail.com"
        print(f"Ensuring specific doctor {target_email} is fully linked...")
        # Update name to match if needed
        await conn.execute(text("UPDATE users SET name = 'Dr. Arjun Reddy' WHERE email = :email"), {"email": target_email})
        await conn.execute(text("UPDATE hospital_tieup_doctors SET name = 'Dr. Arjun Reddy' WHERE email = :email"), {"email": target_email})

    print("Success: All doctors are now cross-calculated and linked.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(health_check_and_fix())
