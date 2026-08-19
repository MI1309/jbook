#!/usr/bin/env python3
"""
Import backend/data/kotoba_ji_to_tadoshi.json into the Vocab database.
Overwrites existing entries for the same `word` and removes duplicates.
Run: python backend/scripts/import_kotoba_ji_to_tadoshi.py
"""
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from utils.kotoba_sync import sync_from_json_file

DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(ROOT), 'data', 'kotoba_ji_to_tadoshi.json'))

if __name__ == '__main__':
    print(f"Importing {DATA_FILE} into database...")
    result = sync_from_json_file(DATA_FILE, skip_existing=False)
    if isinstance(result, dict) and 'error' in result:
        print(f"ERROR: {result['error']}")
        sys.exit(1)
    else:
        print("Import finished:")
        print(result)
        sys.exit(0)
