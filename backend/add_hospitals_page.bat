@echo off
set PGPASSWORD=Javali786
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d healthsystem_pg -f database\add_hospital_tieups.sql
echo.
echo ========================================
echo Hospital Tie-ups added successfully!
echo ========================================
echo 20 Hospitals + Doctors added to Hospital Page!
echo.
pause
