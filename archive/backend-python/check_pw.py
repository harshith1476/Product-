import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.core.security import verify_password

async def verify():
    async with engine.begin() as conn:
        res = await conn.run_sync(lambda c: c.execute(text("SELECT id, email, password, role FROM users WHERE email='shaikjavedali19@gmail.com'")).fetchone())
        
        has_user = res is not None
        if not has_user:
            print("User not found!")
            return
            
        print(f"User found: {res[1]}")
        print(f"Role: {res[3]}")
        password_hash = res[2]
        print(f"Hash: {password_hash}")
        matches_shaik = verify_password('shaikjaved', password_hash)
        matches_12345678 = verify_password('12345678', password_hash)
        matches_shaik123 = verify_password('shaik123', password_hash)
        print(f"Matches 'shaikjaved': {matches_shaik}")
        print(f"Matches '12345678': {matches_12345678}")
        print(f"Matches 'shaik123': {matches_shaik123}")
        
asyncio.run(verify())
