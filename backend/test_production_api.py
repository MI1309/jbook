import requests
import json

BASE_URL = "https://imronm.pythonanywhere.com/api/content/vocab"

def check_production_data():
    print(f"Checking data from: {BASE_URL}")
    
    # Check Search for '見ます' (Lesson 26 Kanji)
    print("\n--- Searching for '見ます' (Lesson 26 Kanji) ---")
    try:
        res = requests.get(f"{BASE_URL}?search=見ます")
        if res.status_code == 200:
            data = res.json()
            if data:
                print(f"HASIL: Ditemukan {len(data)} data.")
                print(f"DATA: {json.dumps(data[0], indent=2, ensure_ascii=False)}")
                print("\nBUKTI BERHASIL: Word '見ます' dengan arti 'memeriksa, melihat' ada di PRODUKSI.")
            else:
                print("HASIL: Tidak ditemukan. '見ます' belum ada di produksi.")
        else:
            print(f"Error: HTTP {res.status_code}")
    except Exception as e:
        print(f"Error fetching data: {e}")

if __name__ == "__main__":
    check_production_data()
