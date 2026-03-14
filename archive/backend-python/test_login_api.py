
import asyncio
import httpx

async def test_login():
    url = "http://localhost:4000/api/user/login"
    payload = {
        "email": "shaikjavedali19@gmail.com",
        "password": "Javali786"
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            print(f"Status: {response.status_code}")
            print(f"Body: {response.text}")
    except Exception as e:
        print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    asyncio.run(test_login())
