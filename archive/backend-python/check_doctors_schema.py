import asyncio
import asyncpg
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
# Convert from async SQLAlchemy URL to plain PostgreSQL URL
db_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def check():
    conn = await asyncpg.connect(db_url)
    
    print("hospital_tieup_doctors columns:")
    rows = await conn.fetch("""
        SELECT column_name, column_default, is_nullable, data_type
        FROM information_schema.columns 
        WHERE table_name = 'hospital_tieup_doctors'
        ORDER BY ordinal_position
    """)
    for r in rows:
        print(f"  {r['column_name']}: {r['data_type']} (nullable={r['is_nullable']}, default={r['column_default']})")
    
    if not rows:
        print("  TABLE DOES NOT EXIST!")
    
    await conn.close()

asyncio.run(check())
