import os
import django
import uuid

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# pyrefly: ignore [missing-import]
from content.models import Kanji, Vocab

def cleanup():
    print("=== Starting Database Cleanup ===\n")
    
    # --- KANJI CLEANUP ---
    print("1. Cleaning up Kanji duplicates...")
    all_chars = Kanji.objects.values_list('character', flat=True).distinct()
    k_deleted = 0
    
    for char in all_chars:
        kanjis = Kanji.objects.filter(character=char).order_by('radical', 'id')
        if kanjis.count() > 1:
            print(f"   Found {kanjis.count()} entries for Kanji: {char}")
            # Keep the one with a radical if it exists, otherwise keep the first one
            best_kanji = None
            for k in kanjis:
                if k.radical:
                    best_kanji = k
                    break
            if not best_kanji:
                best_kanji = kanjis[0]
            
            to_delete = kanjis.exclude(id=best_kanji.id)
            count = to_delete.count()
            to_delete.delete()
            k_deleted += count
            print(f"   - Kept ID: {str(best_kanji.id)[:8]}..., Deleted: {count}")

    # --- VOCAB CLEANUP ---
    print("\n2. Cleaning up Vocab (Kotoba) duplicates...")
    # Group by word and reading to identify duplicates
    from django.db.models import Count
    duplicates = Vocab.objects.values('word', 'reading').annotate(count=Count('id')).filter(count__gt=1)
    
    v_deleted = 0
    for entry in duplicates:
        word = entry['word']
        reading = entry['reading']
        print(f"   Found {entry['count']} entries for Kotoba: {word} ({reading})")
        
        items = Vocab.objects.filter(word=word, reading=reading).order_by('id')
        # Keep the first one, delete the rest
        best_item = items[0]
        to_delete = items.exclude(id=best_item.id)
        count = to_delete.count()
        to_delete.delete()
        v_deleted += count
        print(f"   - Kept ID: {str(best_item.id)[:8]}..., Deleted: {count}")

    # --- RADICAL FIXES ---
    print("\n3. Fixing missing radicals...")
    RADICAL_FIXES = {
        "二": "二", "十": "十", "会": "人", "力": "力", "勉": "力",
        "口": "口", "夕": "夕", "曜": "日", "楽": "木", "犬": "犬",
        "田": "田", "空": "穴", "飲": "食", "駅": "馬"
    }
    
    fixed = 0
    for char, radical in RADICAL_FIXES.items():
        k = Kanji.objects.filter(character=char).first()
        if k and (not k.radical or k.radical == "NULL"):
            k.radical = radical
            k.save()
            fixed += 1
            print(f"   Fixed radical for {char}: {radical}")

    print(f"\n=== Cleanup Finished ===")
    print(f"Kanji deleted: {k_deleted}")
    print(f"Vocab deleted: {v_deleted}")
    print(f"Radicals fixed: {fixed}")

if __name__ == "__main__":
    cleanup()
