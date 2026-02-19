import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/learning/practice/generate"

def test_generate(type_param):
    print(f"--- Testing {type_param} ---")
    try:
        res = requests.get(f"{BASE_URL}?limit=2&type={type_param}")
        res.raise_for_status()
        questions = res.json()
        if not questions:
            print("No questions returned.")
            return

        q = questions[0]
        print(json.dumps(q, indent=2, ensure_ascii=False))
        
        # Check keys
        print("Reading present:", q.get('reading') is not None)
        print("Meaning present:", q.get('meaning') is not None)
        
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    test_generate('vocab')
    test_generate('grammar')
