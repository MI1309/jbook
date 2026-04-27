import os
import django
import uuid

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Kanji

def cleanup():
    print("Starting Kanji database cleanup...")
    
    # Get all characters
    all_chars = Kanji.objects.values_list('character', flat=True).distinct()
    
    total_deleted = 0
    total_fixed = 0
    
    for char in all_chars:
        kanjis = Kanji.objects.filter(character=char).order_by('radical', 'id')
        if kanjis.count() > 1:
            print(f"Found {kanjis.count()} entries for character: {char}")
            # Keep the one with a radical if it exists, otherwise keep the first one
            # Because we ordered by 'radical' DESC (implicitly NULLs last usually, but let's be explicit)
            best_kanji = None
            for k in kanjis:
                if k.radical:
                    best_kanji = k
                    break
            if not best_kanji:
                best_kanji = kanjis[0]
            
            # Delete others
            to_delete = kanjis.exclude(id=best_kanji.id)
            count = to_delete.count()
            to_delete.delete()
            total_deleted += count
            print(f"  Kept ID: {best_kanji.id}, Deleted: {count} duplicates.")

    # Fix radicals for known ones if still NULL
    RADICAL_FIXES = {
        "二": "二",
        "十": "十",
        "会": "人",
        "力": "力",
        "勉": "力",
        "口": "口",
        "夕": "夕",
        "曜": "日",
        "楽": "木",
        "犬": "犬",
        "田": "田",
        "空": "穴",
        "飲": "食",
        "駅": "馬"
    }
    
    for char, radical in RADICAL_FIXES.items():
        k = Kanji.objects.filter(character=char).first()
        if k and (not k.radical or k.radical == "NULL"):
            k.radical = radical
            k.save()
            total_fixed += 1
            print(f"Fixed radical for {char}: {radical}")

    print(f"\nCleanup finished!")
    print(f"Total duplicates deleted: {total_deleted}")
    print(f"Total radicals fixed: {total_fixed}")

if __name__ == "__main__":
    cleanup()
