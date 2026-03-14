
import asyncio
import httpx

async def test_hospital_tieup():
    url = "http://localhost:8000/api/hospital-tieup/all"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            print(f"Status: {response.status_code}")
            # print(f"Body: {response.text[:200]}...")
            if response.status_code == 200:
                data = response.json()
                print(f"Success: {data.get('success')}")
                print(f"Count: {len(data.get('hospitals', []))}")
            else:
                print(f"Error: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_hospital_tieup())
