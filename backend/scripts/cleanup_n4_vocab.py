import os
import django
import sys
import re

# Setup Django
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(BASE_DIR, '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab

def clean_meaning(meaning):
    if not meaning:
        return ""
    
    # Remove redundant parts separated by comma or semicolon
    parts = re.split(r'[,;]', meaning)
    unique_parts = []
    seen = set()
    for p in parts:
        clean_p = p.strip().lower()
        # Remove "untuk " prefix
        if clean_p.startswith('untuk '):
            clean_p = clean_p[6:]
        
        if clean_p and clean_p not in seen:
            unique_parts.append(p.strip())
            seen.add(clean_p)
    
    # Rejoin
    cleaned = ", ".join(unique_parts)
    
    # Final cleanup of common prefixes if they still exist
    if cleaned.lower().startswith('untuk '):
        cleaned = cleaned[6:]
    
    # Capitalize first letter
    if cleaned:
        cleaned = cleaned[0].upper() + cleaned[1:]
        
    return cleaned

def cleanup_n4():
    print("Starting N4 Vocab cleanup...")
    n4_vocabs = Vocab.objects.filter(jlpt_level=4)
    total = n4_vocabs.count()
    print(f"Total N4 entries found: {total}")
    
    updated_count = 0
    for v in n4_vocabs:
        old_meaning = v.meaning
        new_meaning = clean_meaning(old_meaning)
        
        if old_meaning != new_meaning:
            v.meaning = new_meaning
            v.save()
            updated_count += 1
            if updated_count % 100 == 0:
                print(f"Processed {updated_count} updates...")

    print(f"Cleanup finished. Updated {updated_count} entries.")
    
    # Final check on count
    final_count = Vocab.objects.filter(jlpt_level=4).count()
    print(f"Final N4 count in database: {final_count}")

if __name__ == "__main__":
    cleanup_n4()
