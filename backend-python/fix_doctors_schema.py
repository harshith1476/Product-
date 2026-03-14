import asyncio
import asyncpg
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
db_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def fix():
    conn = await asyncpg.connect(db_url)
    
    # Add the missing updated_at column to hospital_tieup_doctors
    print("Adding updated_at column to hospital_tieup_doctors...")
    await conn.execute("""
        ALTER TABLE hospital_tieup_doctors 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    """)
    print("✅ Added updated_at column")
    
    # Also fix experience column type from integer to varchar
    # The model expects String but DB has integer
    print("Fixing experience column type...")
    await conn.execute("""
        ALTER TABLE hospital_tieup_doctors 
        ALTER COLUMN experience TYPE VARCHAR USING experience::VARCHAR
    """)
    print("✅ Fixed experience column type")
    
    # Make qualification and specialization nullable (model has nullable=True)
    print("Making qualification nullable...")
    await conn.execute("""
        ALTER TABLE hospital_tieup_doctors 
        ALTER COLUMN qualification DROP NOT NULL
    """)
    print("✅ Made qualification nullable")
    
    print("Making specialization nullable...")
    await conn.execute("""
        ALTER TABLE hospital_tieup_doctors 
        ALTER COLUMN specialization DROP NOT NULL
    """)
    print("✅ Made specialization nullable")
    
    # Verify
    print("\nVerifying schema:")
    rows = await conn.fetch("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'hospital_tieup_doctors'
        ORDER BY ordinal_position
    """)
    for r in rows:
        print(f"  {r['column_name']}: {r['data_type']} (nullable={r['is_nullable']})")
    
    await conn.close()

asyncio.run(fix())
