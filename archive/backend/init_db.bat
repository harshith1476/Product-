@echo off
set PGPASSWORD=Javali786
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d healthsystem_pg -f database\complete-schema.sql
echo Database initialized successfully with all tables!
pause
