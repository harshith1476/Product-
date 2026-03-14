import requests

# Test data
email = "medichain123@gmail.com"
password = "VHARSHITH121427$$"

# Test admin login
r = requests.post('http://localhost:8000/api/admin/login', json={
    'email': email,
    'password': password
})
print("Admin Login Status:", r.status_code)
print("Admin Login Response:", r.json())

if r.json().get('success'):
    token = r.json()['token']
    # Test dashboard
    r2 = requests.get('http://localhost:8000/api/admin/dashboard', headers={'atoken': token})
    print("\nDashboard Status:", r2.status_code)
    print("Dashboard Response:", r2.json())
