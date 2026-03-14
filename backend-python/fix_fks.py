import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check_fks():
    async with engine.begin() as conn:
        res = await conn.run_sync(lambda c: c.execute(text("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE contype = 'f' AND conrelid = 'appointments'::regclass;")).fetchall())
        print("FKs on appointments: ", res)
        # Drop the strict doctor_id constraint to allow hospital tie-up doctor IDs
        await conn.run_sync(lambda c: c.execute(text("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;")))
        print("Dropped constraint appointments_doctor_id_fkey")
        
asyncio.run(check_fks())
