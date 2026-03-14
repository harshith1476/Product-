
import asyncio
from app.db.session import SessionLocal
from app.models.hospital import HospitalTieUp

async def test_insert():
    print("Testing direct DB insert...")
    async with SessionLocal() as db:
        try:
            h = HospitalTieUp(
                name="Direct Test Hospital",
                address="123 Test St",
                contact="999-999-9999",
                specialization="Testing",
                type="General",
                show_on_home=False
            )
            print("Adding...")
            db.add(h)
            print("Committing...")
            await db.commit()
            print(f"✅ Inserted Hospital ID: {h.id}")
            
            # Access doctors?
            # print(f"Doctors: {h.doctors}") 
        except Exception as e:
            print(f"❌ Failed: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(test_insert())
