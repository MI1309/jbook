
import os
import django
import sys
import json

# Setup Django environment
sys.path.append('/home/imron/jbook/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jbook.settings')
django.setup()

from content.models import Kanji

def check_data():
    count = Kanji.objects.count()
    print(f"Total Kanji count: {count}")
    
    if count > 0:
        k = Kanji.objects.first()
        print(f"Sample Kanji: {k.character}")
        print(f"Meaning: {k.meaning}")
        print(f"Onyomi ({type(k.onyomi)}): {k.onyomi}")
        print(f"Kunyomi ({type(k.kunyomi)}): {k.kunyomi}")

if __name__ == "__main__":
    check_data()
