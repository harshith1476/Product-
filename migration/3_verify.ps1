# ============================================================
#  ✅ STEP 3 — Verify Migration on AWS RDS
#  Run this script AFTER running 2_restore_to_rds.ps1
# ============================================================

# Load config
. "$PSScriptRoot\config.ps1"

$env:PGPASSWORD = $RDS_PASSWORD

Write-Host ""
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host "  Migration Verification Tool" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor DarkCyan
Write-Host ""

# ─── List all tables ──────────────────────────────────────
Write-Host "📋 Tables found in '$RDS_DB_NAME' on RDS:" -ForegroundColor Yellow
Write-Host ""

psql `
    --host=$RDS_ENDPOINT `
    --port=$RDS_PORT `
    --username=$RDS_USERNAME `
    --dbname=$RDS_DB_NAME `
    --command="\dt"

Write-Host ""

# ─── Row counts for all tables ───────────────────────────
Write-Host "📊 Row counts per table:" -ForegroundColor Yellow
Write-Host ""

psql `
    --host=$RDS_ENDPOINT `
    --port=$RDS_PORT `
    --username=$RDS_USERNAME `
    --dbname=$RDS_DB_NAME `
    --command="
SELECT
    schemaname AS schema,
    relname    AS table_name,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
"

Write-Host ""

# ─── Database size ────────────────────────────────────────
Write-Host "💾 Database size on RDS:" -ForegroundColor Yellow
Write-Host ""

psql `
    --host=$RDS_ENDPOINT `
    --port=$RDS_PORT `
    --username=$RDS_USERNAME `
    --dbname=$RDS_DB_NAME `
    --command="SELECT pg_size_pretty(pg_database_size('$RDS_DB_NAME')) AS database_size;"

Write-Host ""
Write-Host "🎉 Verification complete! Update your backend .env to point to RDS." -ForegroundColor Green
Write-Host ""

# Cleanup
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
