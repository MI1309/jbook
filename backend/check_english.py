import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab

vocabs = Vocab.objects.all()
english_vocabs = []
# A simple heuristic to detect English: contains ' to ' (as in 'to eat'), ' the ', ' a ', ' an ', 'is', 'are'
# Or just use langdetect if installed. But let's check for common English substrings.
eng_keywords = [' to ', ' the ', ' a ', ' an ', ' is ', ' are ', ' in ', ' on ', ' of ', ' and ', ' with ']

for v in vocabs:
    meaning = v.meaning.lower()
    if meaning.startswith('to '):
        english_vocabs.append(v)
        continue
    for kw in eng_keywords:
        if kw in meaning:
            english_vocabs.append(v)
            break

print(f"Total vocabs: {vocabs.count()}")
print(f"Found {len(english_vocabs)} potentially English vocabs.")
for v in english_vocabs[:20]:
    print(f"[{v.word}] {v.meaning}")
