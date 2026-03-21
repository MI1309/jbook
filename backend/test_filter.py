import os
import django
from django.conf import settings
from django.db.models import Q

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab

def test_filter(level=None, search=None):
    qs = Vocab.objects.all().order_by('word')
    print(f"Total initially: {qs.count()}")
    
    if level is not None:
        print(f"Filtering by level={level}")
        qs = qs.filter(jlpt_level=level)
        print(f"Count after level filter: {qs.count()}")
        
    if search:
        qs = qs.filter(Q(word__icontains=search) | Q(meaning__icontains=search))
        print(f"Count after search filter: {qs.count()}")
        
    items = list(qs[:5])
    for item in items:
        print(f"- {item.word} (N{item.jlpt_level})")

print("--- Testing Level 5 (N5) ---")
test_filter(level=5)

print("\n--- Testing Search 'neko' ---")
test_filter(search='neko')
