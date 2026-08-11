import json
import os
import sys
from pathlib import Path

import requests

# Setup sys.path to include backend root directory for Django if needed
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(BACKEND_ROOT))

API_BASE_URL = os.environ.get('JBOOK_API_BASE_URL', 'https://imronm.pythonanywhere.com/api')
API_EMAIL = os.environ.get('JBOOK_API_EMAIL')
API_PASSWORD = os.environ.get('JBOOK_API_PASSWORD')
DATA_FILE = BACKEND_ROOT / 'data' / 'kotoba_lengkap_n4.json'


def get_auth_token(email: str, password: str) -> str:
    url = f"{API_BASE_URL}/auth/login"
    resp = requests.post(url, json={
        'identifier': email,
        'password': password,
    })
    resp.raise_for_status()
    data = resp.json()
    return data.get('access')


def check_word_online(word: str, token: str) -> bool:
    url = f"{API_BASE_URL}/content/kotoba"
    params = {
        'search': word,
        'limit': 1,
        'page': 1,
    }
    headers = {
        'Authorization': f'Bearer {token}'
    }
    resp = requests.get(url, params=params, headers=headers)
    resp.raise_for_status()
    data = resp.json()
    items = data.get('items', [])
    if not items:
        return False
    # check for exact word match in returned results
    for item in items:
        if item.get('word') == word:
            return True
    return False


def main():
    if not DATA_FILE.exists():
        print(f"Data file not found: {DATA_FILE}")
        sys.exit(1)

    if not API_EMAIL or not API_PASSWORD:
        print("Environment variables JBOOK_API_EMAIL and JBOOK_API_PASSWORD must be set.")
        sys.exit(1)

    token = get_auth_token(API_EMAIL, API_PASSWORD)
    print(f"Authenticated to {API_BASE_URL} as {API_EMAIL}")

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        entries = json.load(f)

    report = {
        'found': 0,
        'missing': 0,
        'checked': 0,
        'errors': 0,
    }
    missing_words = []

    for item in entries:
        word = item.get('word')
        if not word:
            continue
        report['checked'] += 1
        try:
            exists = check_word_online(word, token)
            if exists:
                report['found'] += 1
            else:
                report['missing'] += 1
                missing_words.append(word)
            print(f"{word}: {'FOUND' if exists else 'MISSING'}")
        except Exception as exc:
            report['errors'] += 1
            print(f"{word}: ERROR - {exc}")

    print("\n=== SUMMARY ===")
    print(f"Checked : {report['checked']}")
    print(f"Found   : {report['found']}")
    print(f"Missing : {report['missing']}")
    print(f"Errors  : {report['errors']}")

    if missing_words:
        print("\nMissing words:")
        for w in missing_words:
            print(f" - {w}")


if __name__ == '__main__':
    main()
