# ============================================================
#  🔑 MIGRATION CONFIG — AWS RDS Credentials
# ============================================================

# --- LOCAL PostgreSQL (auto-filled from your .env) ---
$LOCAL_HOST     = "localhost"
$LOCAL_PORT     = "5432"
$LOCAL_DB_NAME  = "healthsystem_pg"          # ✅ from your .env
$LOCAL_USERNAME = "postgres"                  # ✅ from your .env
# NOTE: You will be prompted for local password when dumping

# --- AWS RDS PostgreSQL ---
$RDS_ENDPOINT   = "pms-db.c9ue2w8i2zs4.ap-south-1.rds.amazonaws.com"
$RDS_PORT       = "5432"
$RDS_DB_NAME    = "pms-db"
$RDS_USERNAME   = "postgres"
# ✅ FIXED: Single quotes prevent PowerShell from interpreting $$ as a special variable
$RDS_PASSWORD   = 'VHARSHITH121476$$'

# --- Dump File Location ---
$DUMP_FILE      = "C:\migration\local_dump.sql"
