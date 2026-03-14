import httpx
import asyncio

async def test():
    # Login first
    async with httpx.AsyncClient(timeout=30.0) as client:
        login_res = await client.post(
            "http://127.0.0.1:8000/api/v1/login/access-token",
            data={"username": "testuser@example.com", "password": "strongpassword123"}
        )
        print(f"Login: {login_res.status_code}")
        if login_res.status_code != 200:
            print(login_res.text)
            return
        token = login_res.json()["access_token"]
    
    # Now try hospital creation with a fresh client
    import random
    async with httpx.AsyncClient(timeout=30.0) as client:
        headers = {"Authorization": f"Bearer {token}"}
        hospital_data = {
            "name": f"Test Hospital {random.randint(1, 10000)}",
            "address": "123 Main St",
            "contact": "555-0199",
            "specialization": "General",
            "show_on_home": True
        }
        print(f"Sending: {hospital_data}")
        try:
            res = await client.post(
                "http://127.0.0.1:8000/api/v1/hospital-tieup/add",
                json=hospital_data,
                headers=headers
            )
            print(f"Status: {res.status_code}")
            print(f"Response: {res.text}")
        except Exception as e:
            print(f"Exception: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test())
