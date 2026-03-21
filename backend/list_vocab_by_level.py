import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab, JLPTLevel

levels = [JLPTLevel.N4, JLPTLevel.N5]

for level in levels:
    count = Vocab.objects.filter(jlpt_level=level).count()
    print(f"\n--- JLPT {level.label} (Count: {count}) ---")
    items = Vocab.objects.filter(jlpt_level=level).order_by('word')[:20]
    for v in items:
        print(f"{v.word} ({v.reading}): {v.meaning}")
