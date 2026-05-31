import os
import django
import sys

# Project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab
from django.db import transaction
from django.db.models import Count

def merge_meanings(m1, m2):
    if not m1: return m2
    if not m2: return m1
    
    # Split by common delimiters
    p1 = [x.strip().lower() for x in m1.replace(';', ',').split(',')]
    p2 = [x.strip().lower() for x in m2.replace(';', ',').split(',')]
    
    combined = list(set(p1 + p2))
    return ", ".join(combined)

def cleanup():
    print("Starting Vocab cleanup...")
    
    # 1. Handle exact word + reading duplicates first
    word_duplicates = Vocab.objects.values('word', 'reading').annotate(count=Count('id')).filter(count__gt=1)
    print(f"Found {len(word_duplicates)} exact word+reading duplicates.")
    
    total_deleted = 0
    for wdup in word_duplicates:
        w_entries = list(Vocab.objects.filter(word=wdup['word'], reading=wdup['reading']).order_by('id'))
        target = w_entries[0]
        for source in w_entries[1:]:
            print(f"Deleting exact duplicate: '{source.word}' ({source.id})")
            target.meaning = merge_meanings(target.meaning, source.meaning)
            if source.examples:
                target.examples = list(set(target.examples + source.examples))
            source.delete()
            total_deleted += 1
        target.save()

    # 2. Handle Kana version redundant when Kanji version exists
    duplicates = Vocab.objects.values('reading').annotate(count=Count('id')).filter(count__gt=1)
    print(f"Found {len(duplicates)} readings with potential Kanji/Kana redundancy.")
    
    total_merged = 0
    for dup in duplicates:
        reading = dup['reading']
        entries = list(Vocab.objects.filter(reading=reading))
        
        kanji_entries = [e for e in entries if e.word != e.reading]
        kana_entries = [e for e in entries if e.word == e.reading]
        
        if kanji_entries and kana_entries:
            # We have at least one Kanji version and at least one Kana version
            # Usually, the Kana version is redundant.
            # Merge each Kana entry into the most appropriate Kanji entry.
            # For simplicity, we'll merge it into the FIRST kanji entry if multiple exist.
            target = kanji_entries[0]
            for source in kana_entries:
                print(f"Merging redundant Kana '{source.word}' into Kanji '{target.word}' (Reading: {reading})")
                target.meaning = merge_meanings(target.meaning, source.meaning)
                if source.examples:
                    target.examples = list(set(target.examples + source.examples))
                source.delete()
                total_deleted += 1
                total_merged += 1
            target.save()

    print(f"Cleanup finished. Merged {total_merged} redundant Kana entries, deleted {total_deleted} total entries.")

if __name__ == "__main__":
    with transaction.atomic():
        cleanup()
