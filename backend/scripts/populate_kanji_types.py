import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Kanji, Vocab

def populate_kanji_types():
    kanjis = Kanji.objects.all()
    total = kanjis.count()
    print(f"Starting population of word_type for {total} Kanji...")
    
    updated = 0
    for k in kanjis:
        # 1. Exact match e.g. "方"
        v = Vocab.objects.filter(word=k.character).first()
        if v and v.word_type:
            k.word_type = v.word_type
            k.save()
            updated += 1
            continue
            
        # 2. Tilde match e.g. "～方"
        v_tilde = Vocab.objects.filter(word=f"～{k.character}").first()
        if v_tilde and v_tilde.word_type:
            k.word_type = v_tilde.word_type
            k.save()
            updated += 1
            
    print(f"Done! Updated {updated} Kanji word types.")

if __name__ == "__main__":
    populate_kanji_types()
