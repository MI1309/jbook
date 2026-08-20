import unicodedata
from django.core.management.base import BaseCommand
from content.models import Vocab, Kanji
from utils.kotoba_sync import generate_furigana_map

class Command(BaseCommand):
    help = 'Normalize all Vocab and Kanji unicode characters (NFKC) and update furigana map'

    def handle(self, *args, **options):
        self.stdout.write("Normalizing Vocab objects...")
        vocab_updated = 0
        for v in Vocab.objects.all():
            changed = False
            
            norm_word = unicodedata.normalize('NFKC', v.word)
            if v.word != norm_word:
                v.word = norm_word
                changed = True
                
            norm_reading = unicodedata.normalize('NFKC', v.reading)
            if v.reading != norm_reading:
                v.reading = norm_reading
                changed = True
                
            if v.furigana:
                norm_furi = unicodedata.normalize('NFKC', v.furigana)
                if v.furigana != norm_furi:
                    v.furigana = norm_furi
                    changed = True

            # Regenerate furigana map
            new_fmap = generate_furigana_map(v.word)
            if v.furigana_map != new_fmap:
                v.furigana_map = new_fmap
                changed = True

            if changed:
                v.save()
                vocab_updated += 1

        self.stdout.write(self.style.SUCCESS(f"Updated {vocab_updated} Vocab entries."))

        self.stdout.write("Normalizing Kanji objects...")
        kanji_updated = 0
        for k in Kanji.objects.all():
            changed = False
            norm_char = unicodedata.normalize('NFKC', k.character)
            if k.character != norm_char:
                k.character = norm_char
                changed = True
            
            norm_meaning = unicodedata.normalize('NFKC', k.meaning)
            if k.meaning != norm_meaning:
                k.meaning = norm_meaning
                changed = True
                
            if changed:
                k.save()
                kanji_updated += 1

        self.stdout.write(self.style.SUCCESS(f"Updated {kanji_updated} Kanji entries."))
