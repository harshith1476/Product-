import asyncio
from sqlalchemy import text
from app.db.session import engine

async def eval_db():
    async with engine.begin() as conn:
        res1 = await conn.run_sync(lambda c: c.execute(text("SELECT id, name FROM doctors LIMIT 5")).fetchall())
        print(f"Doctors: {res1}")
        res2 = await conn.run_sync(lambda c: c.execute(text("SELECT id, name FROM hospital_tieup_doctors WHERE id = 45")).fetchall())
        print(f"Hospital Doctors ID 45: {res2}")
        
asyncio.run(eval_db())
