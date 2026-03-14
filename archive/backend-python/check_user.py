import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check_user():
    async with engine.begin() as conn:
        res = await conn.run_sync(lambda c: c.execute(text("SELECT id, email, password, role FROM users WHERE email='shaikjavedali19@gmail.com'")).fetchall())
        print(f"User: {res}")
        
asyncio.run(check_user())
