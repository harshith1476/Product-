import asyncio
import asyncpg
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    db_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
else:
    db_url = DATABASE_URL

async def update_schema():
    print(f"Connecting to database...")
    conn = await asyncpg.connect(db_url)
    
    print("Adding 'about' and 'fees' columns to hospital_tieup_doctors...")
    
    # Add 'about' column
    try:
        await conn.execute("""
            ALTER TABLE hospital_tieup_doctors 
            ADD COLUMN IF NOT EXISTS about TEXT
        """)
        print("✅ Added 'about' column")
    except Exception as e:
        print(f"❌ Error adding 'about' column: {e}")

    # Add 'fees' column
    try:
        await conn.execute("""
            ALTER TABLE hospital_tieup_doctors 
            ADD COLUMN IF NOT EXISTS fees INTEGER DEFAULT 50
        """)
        print("✅ Added 'fees' column")
    except Exception as e:
        print(f"❌ Error adding 'fees' column: {e}")

    # Add 'email' column
    try:
        await conn.execute("""
            ALTER TABLE hospital_tieup_doctors 
            ADD COLUMN IF NOT EXISTS email VARCHAR
        """)
        print("✅ Added 'email' column")
    except Exception as e:
        print(f"❌ Error adding 'email' column: {e}")
        
    # Verify the current state of the table
    print("\nVerifying current schema for hospital_tieup_doctors:")
    rows = await conn.fetch("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'hospital_tieup_doctors'
        ORDER BY ordinal_position
    """)
    for r in rows:
        print(f"  {r['column_name']}: {r['data_type']} (nullable={r['is_nullable']})")
    
    await conn.close()

if __name__ == "__main__":
    asyncio.run(update_schema())
