import asyncio
from sqlalchemy import text
from app.db.session import engine

async def print_hash():
    async with engine.begin() as conn:
        res = await conn.run_sync(lambda c: c.execute(text("SELECT password FROM users WHERE email='shaikjavedali19@gmail.com'")).fetchone())
        print(f"Hash in DB: {res[0]}")
        
asyncio.run(print_hash())
