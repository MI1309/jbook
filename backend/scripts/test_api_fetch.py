import requests
import os
import django
import sys

sys.path.append('/home/imron/jbook/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Kanji

try:
    # Get a valid token
    auth_resp = requests.post('http://localhost:8000/api/auth/login', json={'email': 'imronm1309@gmail.com', 'password': 'imron123'})
    token = auth_resp.json().get('access')
    print(f"Token: {token[:10]}...")

    # Get a valid ID
    kanji = Kanji.objects.first()
    if not kanji:
        print("No Kanji found in DB")
        sys.exit(1)
    
    kanji_id = str(kanji.id)
    print(f"Testing ID: {kanji_id}")

    # Test the API
    url = f"http://localhost:8000/api/admin/kanji/{kanji_id}"
    print(f"GET {url}")
    resp = requests.get(url, headers={'Authorization': f'Bearer {token}'})
    
    print(f"Status: {resp.status_code}")
    print(f"Body: {resp.text}")

except Exception as e:
    print(f"Error: {e}")
