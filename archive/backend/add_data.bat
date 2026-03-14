@echo off
set PGPASSWORD=Javali786
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d healthsystem_pg -f database\add_sample_data.sql
echo.
echo ========================================
echo Sample data added successfully!
echo ========================================
echo 10 Doctors and 20 Hospitals added!
echo.
pause
