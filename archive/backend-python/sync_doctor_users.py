
import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

async def main():
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy import select, text
    from app.core.config import settings
    
    # Manually create engine to avoid global metadata issues
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(bind=engine, class_=AsyncSession)
    
    from app.models.hospital import HospitalTieUpDoctor
    from app.models.user import User
    from app.core.security import get_password_hash
    
    async with Session() as db:
        query = select(HospitalTieUpDoctor)
        res = await db.execute(query)
        doctors = res.scalars().all()
        
        print(f"Syncing {len(doctors)} doctors...")
        for doc in doctors:
            if not doc.email: continue
            
            u_query = select(User).where(User.email == doc.email)
            u_res = await db.execute(u_query)
            user = u_res.scalar_one_or_none()
            
            if not user:
                print(f"Creating user {doc.email}")
                # We'll use a known temporary password for sync, 
                # but for the one in the screenshot, maybe we can find it?
                # For now, let's use medichain123
                new_user = User(
                    name=doc.name,
                    email=doc.email,
                    password=get_password_hash("medichain123"),
                    role="doctor"
                )
                db.add(new_user)
            elif user.role != "doctor":
                print(f"Updating role for {doc.email}")
                user.role = "doctor"
                db.add(user)
        
        await db.commit()
    print("Done")

if __name__ == "__main__":
    asyncio.run(main())
