import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.security import verify_password

async def test_pwd():
    engine = create_async_engine("postgresql+asyncpg://postgres:Javali786@localhost/healthsystem_pg")
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT password FROM users WHERE email='shaikjavedali19@gmail.com'"))
        pwd = res.fetchone()[0]
        
    print(f"DB Hash: {pwd}")
    print(f"Length: {len(pwd)}")
    
    try:
        is_valid = verify_password("Javali786", pwd)
        print(f"verify_password result: {is_valid}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_pwd())
