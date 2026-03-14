import requests

# Test login
r = requests.post('http://localhost:8000/api/user/login', json={
    'email': 'vemulaharshith1476@gmail.com',
    'password': 'Harshith@123'
})
print("Login status:", r.status_code)
print("Login response:", r.json())

# Test get-profile with token
if r.json().get('success'):
    token = r.json()['token']
    r2 = requests.get('http://localhost:8000/api/user/get-profile', headers={'token': token})
    print("\nProfile status:", r2.status_code)
    print("Profile response:", r2.json())

# Test doctor list
r_docs = requests.get('http://localhost:8000/api/doctor/list')
print("\nDoctor list success:", r_docs.json().get('success'))
print("Doctors count:", len(r_docs.json().get('doctors', [])))

# Test hospitals
r_hosp = requests.get('http://localhost:8000/api/hospital-tieup/public')
print("\nHospitals success:", r_hosp.json().get('success'))
print("Hospitals count:", len(r_hosp.json().get('hospitals', [])))
