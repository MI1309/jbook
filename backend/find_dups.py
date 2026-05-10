import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab

def check_duplicates():
    v_list = Vocab.objects.filter(jlpt_level=4)
    seen = {}
    duplicates = []
    
    for v in v_list:
        key = v.word.strip()
        if key in seen:
            duplicates.append((seen[key], v))
        else:
            seen[key] = v

    print(f"Total N4 Vocab: {v_list.count()}")
    print(f"Found {len(duplicates)} duplicates based on 'word'")
    
    for dup in duplicates:
        print(f"- {dup[0].word} (ID1: {dup[0].id}, ID2: {dup[1].id})")
        print(f"  M1: {dup[0].meaning} | M2: {dup[1].meaning}")

if __name__ == '__main__':
    check_duplicates()
