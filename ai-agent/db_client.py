# db_client.py
import psycopg2

def get_data_from_db(record_id: str) -> str:
    """
    Fetch the input text from DB for the given id.
    """
    conn = psycopg2.connect(
        host="your-db-host",
        user="your-db-user",
        password="your-db-password",
        dbname="your-db-name"
    )
    cur = conn.cursor()
    cur.execute("SELECT input_text FROM data_table WHERE id = %s", (record_id,))
    result = cur.fetchone()
    cur.close()
    conn.close()

    return result[0] if result else None

