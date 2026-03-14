
import requests
import time
import asyncio
import sys

base = 'http://localhost:8000/api/v1'
errors = []

print('=' * 60)
print('  PMS BACKEND COMPREHENSIVE TEST')
print('=' * 60)

# 1. Root
print('\n1. Root endpoint...')
r = requests.get('http://localhost:8000/')
print(f'   Status: {r.status_code} - {r.json()}')
if r.status_code != 200:
    errors.append('Root failed')

# 2. Health
print('\n2. Health check...')
r = requests.get('http://localhost:8000/health')
print(f'   Status: {r.status_code} - {r.json()}')
if r.status_code != 200:
    errors.append('Health failed')

# 3. Register new user
print('\n3. Register user...')
unique_email = f'test_{int(time.time())}@test.com'
r = requests.post(f'{base}/users/register', json={
    'name': 'Test User',
    'email': unique_email,
    'password': 'testpass123'
})
print(f'   Status: {r.status_code}')
if r.status_code != 200:
    print(f'   Error: {r.json()}')
    errors.append('Register failed')

# 4. Login
print('\n4. Login...')
r = requests.post(f'{base}/login/access-token', data={
    'username': unique_email,
    'password': 'testpass123'
})
print(f'   Status: {r.status_code}')
if r.status_code != 200:
    print(f'   Error: {r.json()}')
    errors.append('Login failed')
token = r.json().get('access_token') if r.status_code == 200 else None
headers = {'Authorization': f'Bearer {token}'} if token else {}

# 5. Get current user
print('\n5. Get me...')
r = requests.get(f'{base}/users/me', headers=headers)
print(f'   Status: {r.status_code}')
if r.status_code != 200:
    print(f'   Error: {r.json()}')
    errors.append('Get me failed')

# 6. Specialty list
print('\n6. Specialty list...')
r = requests.get(f'{base}/specialty/list')
print(f'   Status: {r.status_code} - {len(r.json())} specialties')
if r.status_code != 200:
    errors.append('Specialty list failed')

# 7. Hospital list
print('\n7. Hospital list...')
r = requests.get(f'{base}/hospital-tieup/list')
print(f'   Status: {r.status_code} - {len(r.json())} hospitals')
if r.status_code != 200:
    errors.append('Hospital list failed')

# Make the user admin via DB
print('\n8. Making test user admin...')

async def make_admin():
    from sqlalchemy import text as sql_text
    from app.db.session import SessionLocal
    async with SessionLocal() as db:
        await db.execute(
            sql_text("UPDATE users SET role = 'admin' WHERE email = :email"),
            {'email': unique_email}
        )
        await db.commit()
        result = await db.execute(
            sql_text('SELECT role FROM users WHERE email = :email'),
            {'email': unique_email}
        )
        role = result.scalar()
        print(f'   User role: {role}')
        return role

role = asyncio.run(make_admin())
if role != 'admin':
    errors.append('Make admin failed')

# Re-login to get updated token
r = requests.post(f'{base}/login/access-token', data={
    'username': unique_email,
    'password': 'testpass123'
})
token = r.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

# 9. Create hospital
print('\n9. Create hospital (ADMIN)...')
r = requests.post(f'{base}/hospital-tieup/add', json={
    'name': f'Test Hospital {int(time.time())}',
    'address': '123 Test Street',
    'contact': '555-0100',
    'specialization': 'General',
    'type': 'Private',
    'show_on_home': True
}, headers=headers)
print(f'   Status: {r.status_code}')
hid = None
if r.status_code == 200:
    hid = r.json()['id']
    print(f'   Hospital ID: {hid}')
    print(f'   Doctors list: {r.json().get("doctors", "N/A")}')
else:
    print(f'   Error: {r.json()}')
    errors.append('Create hospital failed')

# 10. Add doctor
if hid:
    print('\n10. Add doctor to hospital (ADMIN)...')
    r = requests.post(f'{base}/hospital-tieup/doctor/add', json={
        'name': 'Dr. Test Doctor',
        'hospital_tieup_id': hid,
        'qualification': 'MBBS',
        'specialization': 'General Medicine',
        'experience': '10 years'
    }, headers=headers)
    print(f'   Status: {r.status_code}')
    if r.status_code == 200:
        print(f'   Doctor ID: {r.json()["id"]}')
    else:
        print(f'   Error: {r.json()}')
        errors.append('Add doctor failed')

# 11. Get hospital by ID
if hid:
    print('\n11. Get hospital by ID...')
    r = requests.get(f'{base}/hospital-tieup/{hid}')
    print(f'   Status: {r.status_code}')
    if r.status_code == 200:
        print(f'   Hospital: {r.json()["name"]}')
        print(f'   Doctors: {len(r.json().get("doctors", []))}')
    else:
        print(f'   Error: {r.json()}')
        errors.append('Get hospital failed')

# 12. Update hospital
if hid:
    print('\n12. Update hospital (ADMIN)...')
    r = requests.put(f'{base}/hospital-tieup/update/{hid}', json={
        'name': f'Updated Hospital {int(time.time())}',
        'show_on_home': False
    }, headers=headers)
    print(f'   Status: {r.status_code}')
    if r.status_code == 200:
        print(f'   Updated name: {r.json()["name"]}')
    else:
        print(f'   Error: {r.json()}')
        errors.append('Update hospital failed')

# 13. Delete hospital
if hid:
    print('\n13. Delete hospital (ADMIN)...')
    r = requests.delete(f'{base}/hospital-tieup/delete/{hid}', headers=headers)
    print(f'   Status: {r.status_code}')
    if r.status_code == 200:
        print(f'   Response: {r.json()}')
    else:
        print(f'   Error: {r.json()}')
        errors.append('Delete hospital failed')

# 14. Create specialty
print('\n14. Create specialty (ADMIN)...')
r = requests.post(f'{base}/specialty/add', json={
    'specialty_name': f'Test Specialty {int(time.time())}',
    'helpline_number': '1800-TEST',
    'availability': '24x7',
    'status': 'Active'
}, headers=headers)
print(f'   Status: {r.status_code}')
sid = None
if r.status_code == 200:
    sid = r.json()['id']
    print(f'   Specialty ID: {sid}')
else:
    print(f'   Error: {r.json()}')
    errors.append('Create specialty failed')

# 15. Delete specialty
if sid:
    print('\n15. Delete specialty (ADMIN)...')
    r = requests.delete(f'{base}/specialty/delete/{sid}', headers=headers)
    print(f'   Status: {r.status_code}')
    if r.status_code == 200:
        print(f'   Response: {r.json()}')
    else:
        print(f'   Error: {r.json()}')
        errors.append('Delete specialty failed')

print('\n' + '=' * 60)
if errors:
    print(f'  FAILED! {len(errors)} error(s):')
    for e in errors:
        print(f'    ❌ {e}')
else:
    print('  ✅ ALL 15 TESTS PASSED!')
print('=' * 60)
