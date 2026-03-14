@echo off
set PGPASSWORD=Javali786
set PSQL="C:\Program Files\PostgreSQL\18\bin\psql.exe"

echo ========================================
echo HOSPITAL TIE-UPS PAGE DATA
echo ========================================
echo.

echo === HOSPITALS ON TIE-UPS PAGE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT id, name, contact, specialization, type FROM hospital_tieups WHERE show_on_home = true ORDER BY id;"
echo.

echo === TOTAL HOSPITALS ON PAGE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT COUNT(*) as total_hospitals FROM hospital_tieups WHERE show_on_home = true;"
echo.

echo === DOCTORS IN TIE-UP HOSPITALS ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT htd.id, ht.name as hospital_name, htd.name as doctor_name, htd.specialization, htd.experience FROM hospital_tieup_doctors htd JOIN hospital_tieups ht ON htd.hospital_tieup_id = ht.id WHERE htd.show_on_hospital_page = true ORDER BY ht.name, htd.name LIMIT 20;"
echo.

echo === TOTAL DOCTORS ON PAGE ===
%PSQL% -U postgres -d healthsystem_pg -c "SELECT COUNT(*) as total_doctors FROM hospital_tieup_doctors WHERE show_on_hospital_page = true;"
echo.

echo ========================================
pause
