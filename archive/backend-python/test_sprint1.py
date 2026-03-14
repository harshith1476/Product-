import httpx
import asyncio
import random

async def make_request(method, url, **kwargs):
    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == 'POST':
            return await client.post(url, **kwargs)
        elif method == 'GET':
            return await client.get(url, **kwargs)

async def test_sprint1():
    print("Testing Sprint 1 Endpoints...", flush=True)
    
    BASE = "http://127.0.0.1:8000/api/v1"
    
    # 1. Login as Admin
    print("Logging in...", flush=True)
    login_res = await make_request('POST', f"{BASE}/login/access-token", 
        data={"username": "testuser@example.com", "password": "strongpassword123"})
    
    if login_res.status_code != 200:
        print(f"❌ Login Failed: {login_res.text}", flush=True)
        return
        
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Logged in successfully.", flush=True)

    # 2. Add Specialty
    spec_name = f"Cardiology {random.randint(1, 10000)}"
    print(f"\nAdding Specialty '{spec_name}'...", flush=True)
    add_spec_res = await make_request('POST', f"{BASE}/specialty/add",
        json={"specialty_name": spec_name, "availability": "9AM-5PM"},
        headers=headers)
    if add_spec_res.status_code == 200:
        print(f"✅ Added Specialty: {add_spec_res.json()['specialty_name']}", flush=True)
    else:
        print(f"❌ Add Specialty Failed ({add_spec_res.status_code}): {add_spec_res.text}", flush=True)

    # 3. List Specialties
    print("\nListing Specialties...", flush=True)
    list_spec_res = await make_request('GET', f"{BASE}/specialty/list")
    if list_spec_res.status_code == 200:
        print(f"✅ Found {len(list_spec_res.json())} specialties.", flush=True)
    else:
        print(f"❌ List Specialties Failed: {list_spec_res.text}", flush=True)

    # 4. Add Hospital Tie-Up
    hosp_name = f"City Hospital {random.randint(1, 10000)}"
    hospital_data = {
        "name": hosp_name,
        "address": "123 Main St",
        "contact": "555-0199",
        "specialization": "General",
        "show_on_home": True
    }
    print(f"\nAdding Hospital '{hosp_name}'...", flush=True)
    add_hosp_res = await make_request('POST', f"{BASE}/hospital-tieup/add",
        json=hospital_data, headers=headers)
    
    if add_hosp_res.status_code == 200:
        hosp_id = add_hosp_res.json()["id"]
        print(f"✅ Added Hospital: ID {hosp_id}", flush=True)
    else:
        print(f"❌ Add Hospital Failed ({add_hosp_res.status_code}): {add_hosp_res.text}", flush=True)
        hosp_id = None

    # 5. Add Doctor to Hospital
    if hosp_id:
        doctor_data = {
            "name": "Dr. Smith",
            "qualification": "MBBS",
            "specialization": "General Medicine",
            "experience": "5 Years",
            "hospital_tieup_id": hosp_id
        }
        print("\nAdding Doctor to Hospital...", flush=True)
        add_doc_res = await make_request('POST', f"{BASE}/hospital-tieup/doctor/add",
            json=doctor_data, headers=headers)
        if add_doc_res.status_code == 200:
            print(f"✅ Added Doctor: {add_doc_res.json()['name']}", flush=True)
        else:
            print(f"❌ Add Doctor Failed ({add_doc_res.status_code}): {add_doc_res.text}", flush=True)

    # 6. List Public Hospitals
    print("\nListing Public Hospitals...", flush=True)
    list_hosp_res = await make_request('GET', f"{BASE}/hospital-tieup/list")
    if list_hosp_res.status_code == 200:
        hosps = list_hosp_res.json()
        print(f"✅ Found {len(hosps)} public hospitals.", flush=True)
        for h in hosps[-3:]:  # Show last 3
            print(f"   - {h['name']} (doctors: {len(h.get('doctors', []))})", flush=True)
    else:
        print(f"❌ List Hospitals Failed ({list_hosp_res.status_code}): {list_hosp_res.text}", flush=True)

    print("\n✅ Sprint 1 tests complete!", flush=True)

if __name__ == "__main__":
    asyncio.run(test_sprint1())
