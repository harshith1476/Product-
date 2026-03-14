import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.security import verify_password

async def fix_pwd():
    engine = create_async_engine('postgresql+asyncpg://postgres:Javali786@localhost/healthsystem_pg')
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT password FROM users WHERE email='shaikjavedali19@gmail.com'"))
        pwd = res.fetchone()[0]
        
    print(f"Original Length: {len(pwd)}")
    pwd_clean = pwd.strip()
    print(f"Clean Length: {len(pwd_clean)}")
    
    try:
        is_valid = verify_password('Javali786', pwd_clean)
        print(f"verify_password result: {is_valid}")
        
        if is_valid:
            async with engine.begin() as conn:
                await conn.execute(text(f"UPDATE users SET password='{pwd_clean}' WHERE email='shaikjavedali19@gmail.com'"))
            print("DB stripped and saved")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(fix_pwd())
