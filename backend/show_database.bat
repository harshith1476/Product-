@echo off
set PGPASSWORD=Javali786
set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"

echo ========================================
echo DATABASE: healthsystem_pg
echo ========================================
echo.

echo === ALL TABLES ===
%PSQL% -U postgres -d healthsystem_pg -c "\dt"
echo.

echo === ADMINS TABLE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT * FROM admins;"
echo.

echo === SPECIALTIES TABLE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT id, specialty_name, helpline_number, availability, status FROM specialties;"
echo.

echo === DOCTORS TABLE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT id, name, email, speciality, degree, experience, fees, available FROM doctors;"
echo.

echo === HOSPITALS TABLE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT id, name, email, address_line1, available FROM hospitals;"
echo.

echo === USERS TABLE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT COUNT(*) as total_users FROM users;"
echo.

echo === APPOINTMENTS TABLE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT COUNT(*) as total_appointments FROM appointments;"
echo.

echo === HEALTH RECORDS TABLE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT COUNT(*) as total_records FROM health_records;"
echo.

echo === JOB APPLICATIONS TABLE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT COUNT(*) as total_applications FROM job_applications;"
echo.

echo ========================================
echo Database Overview Complete!
echo ========================================
pause
