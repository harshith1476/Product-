
import asyncio
from sqlalchemy import text
from app.db.session import engine

async def check_data():
    async with engine.connect() as conn:
        print("--- USER RECORD ---")
        email = "231fa04e20@gmail.com"
        res = await conn.execute(text("SELECT id, name, email, role, length(email) as e_len FROM users WHERE email = :email"), {"email": email})
        user = res.fetchone()
        if user:
            print(f"ID: {user[0]}, Name: '{user[1]}', Email: '{user[2]}', Role: '{user[3]}', EmailLen: {user[4]}")
        else:
            print("User not found by exact email match")
            # Try fuzzy match
            res = await conn.execute(text("SELECT email FROM users WHERE email LIKE '%231fa04e20%'"))
            for row in res.fetchall():
                print(f"Found similar: '{row[0]}'")

        print("\n--- DOCTOR PROFILE ---")
        res = await conn.execute(text("SELECT id, name, email, length(email) as e_len FROM hospital_tieup_doctors WHERE email = :email"), {"email": email})
        doc = res.fetchone()
        if doc:
            print(f"ID: {doc[0]}, Name: '{doc[1]}', Email: '{doc[2]}', EmailLen: {doc[3]}")
        else:
            print("Doctor profile not found by exact email match")
            # Try fuzzy match
            res = await conn.execute(text("SELECT email FROM hospital_tieup_doctors WHERE email LIKE '%231fa04e20%'"))
            for row in res.fetchall():
                print(f"Found similar: '{row[0]}'")

if __name__ == "__main__":
    asyncio.run(check_data())
