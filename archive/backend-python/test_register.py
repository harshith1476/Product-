
import httpx
import asyncio

async def test_register():
    url = "http://127.0.0.1:8000/api/v1/users/register"
    payload = {
        "email": "testuser@example.com",
        "password": "strongpassword123",
        "name": "Test User",
        "phone": "1234567890",
        "role": "patient"
    }
    async with httpx.AsyncClient() as client:
        # Register (might fail if already exists)
        response = await client.post(url, json=payload)
        print(f"Register Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Register Response: {response.json()}")
        elif response.status_code == 400 and "exists" in response.text:
            print("User already exists, proceeding to login.")

        # Login
        login_url = "http://127.0.0.1:8000/api/v1/login/access-token"
        login_payload = {
            "username": payload["email"],
            "password": payload["password"]
        }
        # Note: OAuth2PasswordRequestForm expects form data, not JSON!
        login_response = await client.post(login_url, data=login_payload)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            print(f"Login Response: {token_data}")
            access_token = token_data["access_token"]
            
            # Get Me
            me_url = "http://127.0.0.1:8000/api/v1/users/me"
            headers = {"Authorization": f"Bearer {access_token}"}
            me_response = await client.get(me_url, headers=headers)
            print(f"Me Status: {me_response.status_code}")
            print(f"Me Response: {me_response.json()}")
        else:
            print(f"Login Failed: {login_response.text}")

if __name__ == "__main__":
    asyncio.run(test_register())
