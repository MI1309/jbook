import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab

lesson_26_words = ['みます', 'さがします', 'おくれます']
print(f"Total Vocab count: {Vocab.objects.count()}")

for word in lesson_26_words:
    exists = Vocab.objects.filter(reading=word).exists()
    print(f"Searching for '{word}': {'FOUND' if exists else 'NOT FOUND'}")

# Also check for one word from user's provided JSON to see if it's there
user_word = "葬式"
exists_user = Vocab.objects.filter(word__contains=user_word).exists()
print(f"Searching for '{user_word}': {'FOUND' if exists_user else 'NOT FOUND'}")
