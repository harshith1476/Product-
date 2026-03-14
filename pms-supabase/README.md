# Patient Management System Backend

Production-ready backend for Patient Management System using Node.js, Express, and Supabase PostgreSQL.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Update `.env` file with your Supabase credentials:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.cdlycuzukfjipioepuso.supabase.co:5432/postgres
JWT_SECRET=your_secret_key
PORT=5000
```

### 3. Setup Database
Go to Supabase SQL Editor and run `database/schema.sql`

### 4. Run Server
```bash
npm start        # Production
npm run dev      # Development
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register user
- POST `/api/auth/login` - Login user

### Hospitals
- POST `/api/hospitals` - Create hospital (Admin only)
- GET `/api/hospitals` - Get all hospitals
- GET `/api/hospitals/:id` - Get hospital by ID

### Doctors
- POST `/api/doctors` - Add doctor (Admin only)
- GET `/api/doctors` - Get all doctors
- GET `/api/doctors/:id` - Get doctor by ID
- GET `/api/doctors/hospital/:hospital_id` - Get doctors by hospital

### Patients
- POST `/api/patients` - Add patient (Admin/Doctor)
- GET `/api/patients` - Get all patients
- GET `/api/patients/:id` - Get patient by ID

### Appointments
- POST `/api/appointments` - Book appointment
- GET `/api/appointments` - Get all appointments (Admin/Doctor)
- GET `/api/appointments/doctor/:doctor_id` - Get doctor appointments
- GET `/api/appointments/patient/:patient_id` - Get patient appointments
- PATCH `/api/appointments/:id/status` - Update status (Admin/Doctor)

### Emergencies
- POST `/api/emergencies` - Create emergency request
- GET `/api/emergencies` - Get all emergencies (Admin/Doctor)
- PATCH `/api/emergencies/:id/status` - Update status (Admin)

### Payments
- POST `/api/payments` - Process payment
- GET `/api/payments` - Get all payments (Admin)
- GET `/api/payments/appointment/:appointment_id` - Get payment by appointment
- PATCH `/api/payments/:id/status` - Update payment status (Admin)

## Authentication
All protected routes require Bearer token in Authorization header:
```
Authorization: Bearer <your_token>
```

## Default Admin Credentials
Email: admin@pms.com
Password: admin123
