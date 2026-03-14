import asyncio
import bcrypt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def reset_pw():
    salt = bcrypt.gensalt()
    hash_value = bcrypt.hashpw(b'Javali786', salt).decode('utf-8')
    
    print(f"Generated hash: {hash_value}")
    
    engine = create_async_engine("postgresql+asyncpg://postgres:Javali786@localhost/healthsystem_pg")
    async with engine.begin() as conn:
        await conn.run_sync(lambda c: c.execute(text(f"UPDATE users SET password='{hash_value}' WHERE email='shaikjavedali19@gmail.com'")))
    
    print("Database updated.")

if __name__ == "__main__":
    asyncio.run(reset_pw())
