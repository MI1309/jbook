import requests
import json

BASE_URL = "https://imronm.pythonanywhere.com/api/content/vocab"

def check_production_data():
    print(f"Checking data from: {BASE_URL}")
    
    # 1. Check Search for 'みます'
    print("\n--- Searching for 'みます' (Lesson 26) ---")
    try:
        res = requests.get(f"{BASE_URL}?search=みます")
        if res.status_code == 200:
            data = res.json()
            if data:
                print(f"FOUND: {json.dumps(data[0], indent=2, ensure_ascii=False)}")
            else:
                print("NOT FOUND: 'みます' is missing from production.")
        else:
            print(f"Error: HTTP {res.status_code}")
    except Exception as e:
        print(f"Error fetching data: {e}")

    # 2. Check Search for '葬式' (One that was already there)
    print("\n--- Searching for '葬式' (Old N4 data) ---")
    try:
        res = requests.get(f"{BASE_URL}?search=葬式")
        if res.status_code == 200:
            data = res.json()
            if data:
                print(f"FOUND: {json.dumps(data[0], indent=2, ensure_ascii=False)}")
            else:
                print("NOT FOUND: '葬式' is missing from production.")
        else:
            print(f"Error: HTTP {res.status_code}")
    except Exception as e:
        print(f"Error fetching data: {e}")

if __name__ == "__main__":
    check_production_data()
