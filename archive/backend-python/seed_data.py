"""
Seed script to add 2 hospitals and 2 doctors to the database.
Run: python seed_data.py
"""
import asyncio
import sys
import os

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import SessionLocal as async_session, engine
from app.db.base_class import Base
from app.models.hospital import HospitalTieUp, HospitalTieUpDoctor
from app.models.user import User
from app.models.specialty import Specialty
from app.core.security import get_password_hash


async def seed():
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # ============================
        # Check if data already exists
        # ============================
        result = await db.execute(select(HospitalTieUp))
        existing_hospitals = result.scalars().all()
        if len(existing_hospitals) >= 2:
            print(f"✅ Already have {len(existing_hospitals)} hospitals. Skipping hospital seed.")
        else:
            print("🏥 Seeding hospitals and doctors...")

            # Hospital 1: Apollo Hospitals
            hospital1 = HospitalTieUp(
                name="Apollo Hospitals",
                address="Jubilee Hills, Hyderabad, Telangana 500033",
                contact="+91-40-23607777",
                specialization="Multi Specialty",
                type="Super Specialty",
                show_on_home=True,
            )
            db.add(hospital1)
            await db.flush()

            # Doctors for Hospital 1
            doc1 = HospitalTieUpDoctor(
                hospital_tieup_id=hospital1.id,
                name="Dr. Rajesh Sharma",
                qualification="MBBS, MD (Cardiology)",
                specialization="Cardiology",
                experience="15 years",
                available=True,
                show_on_hospital_page=True,
            )
            doc2 = HospitalTieUpDoctor(
                hospital_tieup_id=hospital1.id,
                name="Dr. Priya Reddy",
                qualification="MBBS, MS (Neurology)",
                specialization="Neurology",
                experience="12 years",
                available=True,
                show_on_hospital_page=True,
            )
            db.add_all([doc1, doc2])

            # Hospital 2: KIMS Hospital
            hospital2 = HospitalTieUp(
                name="KIMS Hospital",
                address="Minister Road, Secunderabad, Telangana 500003",
                contact="+91-40-44885000",
                specialization="General Medicine",
                type="Teaching Hospital",
                show_on_home=True,
            )
            db.add(hospital2)
            await db.flush()

            # Doctors for Hospital 2
            doc3 = HospitalTieUpDoctor(
                hospital_tieup_id=hospital2.id,
                name="Dr. Anil Kumar",
                qualification="MBBS, MD (General Medicine)",
                specialization="General Medicine",
                experience="20 years",
                available=True,
                show_on_hospital_page=True,
            )
            doc4 = HospitalTieUpDoctor(
                hospital_tieup_id=hospital2.id,
                name="Dr. Meena Srinivas",
                qualification="MBBS, MD (Pediatrics)",
                specialization="Pediatrics",
                experience="10 years",
                available=True,
                show_on_hospital_page=True,
            )
            db.add_all([doc3, doc4])

            await db.commit()
            print("✅ Added 2 hospitals with 2 doctors each (4 doctors total)")

        # ============================
        # Seed admin user if not exists
        # ============================
        target_admin_email = "medichain123@gmail.com"
        result = await db.execute(select(User).where(User.email == target_admin_email))
        admin = result.scalar_one_or_none()
        if admin:
            print(f"✅ Admin user already exists: {admin.email}")
        else:
            admin_user = User(
                name="System Admin",
                email=target_admin_email,
                password=get_password_hash("VHARSHITH121427$$"),
                role="admin",
                gender="Not Selected",
                dob="Not Selected",
            )
            db.add(admin_user)
            await db.commit()
            print(f"✅ Created admin user: {target_admin_email} / VHARSHITH121427$$")

        # ============================
        # Seed test patient user
        # ============================
        result = await db.execute(select(User).where(User.email == "vemulaharshith1476@gmail.com"))
        test_user = result.scalar_one_or_none()
        if test_user:
            print(f"✅ Test user already exists: {test_user.email}")
        else:
            patient = User(
                name="Harshith",
                email="vemulaharshith1476@gmail.com",
                password=get_password_hash("Harshith@123"),
                role="patient",
                phone="9876543210",
                gender="Male",
                dob="2000-01-01",
            )
            db.add(patient)
            await db.commit()
            print("✅ Created test patient: vemulaharshith1476@gmail.com / Harshith@123")

        # ============================
        # Seed specialties
        # ============================
        specialties_to_add = [
            "General Medicine", "Cardiology", "Neurology",
            "Pediatrics", "Dental", "Orthopedics",
            "Dermatology", "ENT", "Ophthalmology",
        ]
        for spec_name in specialties_to_add:
            result = await db.execute(select(Specialty).where(Specialty.specialty_name == spec_name))
            if not result.scalar_one_or_none():
                db.add(Specialty(specialty_name=spec_name, status="active"))

        await db.commit()
        print("✅ Specialties seeded")

    print("\n🎉 Seed complete! Your database is ready.")
    print("   👨‍⚕️ 2 Hospitals, 4 Doctors")
    print("   🔑 Admin: medichain123@gmail.com / VHARSHITH121427$$")
    print("   🔑 Patient: vemulaharshith1476@gmail.com / Harshith@123")


if __name__ == "__main__":
    asyncio.run(seed())
