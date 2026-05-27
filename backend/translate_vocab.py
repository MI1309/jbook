import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from content.models import Vocab
from deep_translator import GoogleTranslator

def main():
    vocabs = Vocab.objects.all()
    translator = GoogleTranslator(source='en', target='id')
    
    # Simple heuristic to identify English:
    # A lot of English meanings start with 'to ', or contain ' the ', ' a ', ' an ', ' is ', ' are '
    # Also if we can check if it's already Indonesian (contains 'yang', 'di', 'ke', 'dari', 'untuk', 'sebuah')
    
    eng_keywords = ['to ', 'the ', 'a ', 'an ', 'is ', 'are ', 'in ', 'on ', 'of ', 'and ', 'with ', 'something', 'someone']
    id_keywords = ['yang', 'di', 'ke', 'dari', 'untuk', 'sebuah', 'dengan', 'saya', 'kamu', 'dia', 'mereka', 'kita', 'kami', 'ini', 'itu', 'bisa', 'akan', 'sudah', 'telah']
    
    translated_count = 0
    total = vocabs.count()
    
    print(f"Total vocabularies: {total}")
    
    for i, v in enumerate(vocabs):
        meaning = v.meaning.lower()
        
        # Check if it has strong Indonesian keywords
        has_id = any(f" {kw} " in f" {meaning} " for kw in id_keywords)
        # Check if it has English keywords
        has_eng = any(f" {kw} " in f" {meaning} " for kw in eng_keywords)
        
        # If it doesn't have ID keywords, or it clearly has ENG keywords, try to translate
        # Let's be aggressive in detecting English.
        if has_eng or not has_id:
            # Let's try to translate using auto
            try:
                # We can use GoogleTranslator with source='auto'
                auto_translator = GoogleTranslator(source='auto', target='id')
                translated = auto_translator.translate(v.meaning)
                
                # If the translation is different from the original, it was probably not Indonesian
                # Or it was English and got translated.
                if translated.lower() != v.meaning.lower():
                    print(f"[{v.word}] Original: {v.meaning} -> Translated: {translated}")
                    v.meaning = translated
                    v.save()
                    translated_count += 1
                    time.sleep(0.1) # sleep to avoid rate limit
            except Exception as e:
                print(f"Error translating {v.word}: {e}")
                
        if i % 100 == 0:
            print(f"Processed {i}/{total}...")
            
    print(f"Done! Translated {translated_count} vocabularies.")

if __name__ == '__main__':
    main()
