import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS")
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Error occurred while connecting to the database.: {e}")
        return None

def execute_query(query, params=None, fetch=False):
    conn = get_db_connection()
    if not conn:
        return None
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        try:
            cur.execute(query, params)
            if fetch:
                result = cur.fetchall()
            else:
                conn.commit()
                result = True
        except Exception as e:
            print(f"Error while executing query: {e}")
            conn.rollback()
            result = None
        finally:
            conn.close()
    return result