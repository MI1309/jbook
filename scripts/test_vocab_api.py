import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api/content"

def test_api():
    print(f"Fetching list from {BASE_URL}/vocab...")
    try:
        res = requests.get(f"{BASE_URL}/vocab?limit=1000")
        res.raise_for_status()
        vocabs = res.json()
        print(f"Found {len(vocabs)} vocabs.")
    except Exception as e:
        print(f"List fetch failed: {e}")
        return

    errors = 0
    for v in vocabs:
        vid = v['id']
        try:
            r = requests.get(f"{BASE_URL}/vocab/{vid}")
            if r.status_code != 200:
                print(f"FAILED: {vid} - {r.status_code} - {r.text}")
                errors += 1
            # else:
            #     print(f"OK: {vid}")
        except Exception as e:
            print(f"EXCEPTION: {vid} - {e}")
            errors += 1

    if errors == 0:
        print("All vocab details fetched successfully!")
    else:
        print(f"Found {errors} errors.")

if __name__ == "__main__":
    test_api()
