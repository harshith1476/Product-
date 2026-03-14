import psycopg2
from psycopg2.extras import RealDictCursor

# Connection string from inspect_supabase.js
conn_str = 'postgresql://postgres:yKh#6bJSvVB!+Ki@db.cdlycuzukfjipioepuso.supabase.co:5432/postgres'

def check_supabase():
    try:
        conn = psycopg2.connect(conn_str, sslmode='require')
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("--- Checking Supabase Appointments ---")
        cur.execute("SELECT COUNT(*) FROM appointments")
        count = cur.fetchone()['count']
        print(f"Total Appointments: {count}")
        
        if count > 0:
            cur.execute("SELECT id, slot_date, slot_time, status FROM appointments ORDER BY created_at DESC LIMIT 5")
            rows = cur.fetchall()
            for row in rows:
                print(row)
                
        print("\n--- Checking Supabase Users ---")
        cur.execute("SELECT COUNT(*) FROM users")
        u_count = cur.fetchone()['count']
        print(f"Total Users: {u_count}")
        
        conn.close()
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")

if __name__ == "__main__":
    check_supabase()
