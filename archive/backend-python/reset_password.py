import asyncio
from sqlalchemy import text
from app.db.session import engine
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_pw():
    plain = "Javali786"
    hash_value = pwd_context.hash(plain)
    
    print(f"Generated hash: {hash_value}")
    
    is_valid = pwd_context.verify(plain, hash_value)
    print(f"Verify matches: {is_valid}")
    
    if is_valid:
        async with engine.begin() as conn:
            await conn.run_sync(lambda c: c.execute(text(f"UPDATE users SET password='{hash_value}' WHERE email='shaikjavedali19@gmail.com'")))
        print(f"DB Updated.")
    
asyncio.run(reset_pw())
