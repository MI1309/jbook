import os
import sys

def update_admin():
    try:
        import libsql_experimental as libsql
    except ImportError:
        print("Failed to import libsql_experimental. Did it install correctly?")
        sys.exit(1)
        
    url = "libsql://jbook-mi1309.aws-ap-northeast-1.turso.io"
    
    print(f"Attempting to connect to: {url}")
    try:
        conn = libsql.connect(database=url)
        cursor = conn.cursor()
        cursor.execute("UPDATE users_user SET is_staff = 1 WHERE email = 'imronm1309@gmail.com';")
        conn.commit()
        print("Successfully updated imronm1309@gmail.com to is_staff=True on Turso!")
    except Exception as e:
        print(f"Error connecting to Turso: {e}")
        print("Note: If you got an authentication error, you probably missing the authToken.")
        
if __name__ == '__main__':
    update_admin()
