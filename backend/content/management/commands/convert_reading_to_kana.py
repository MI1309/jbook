from django.core.management.base import BaseCommand
from content.models import Vocab
from utils.kana import to_kana

class Command(BaseCommand):
    help = 'Convert Vocab reading from Romaji to Kana'

    def handle(self, *args, **kwargs):
        vocabs = Vocab.objects.all()
        count = 0
        for v in vocabs:
            # Simple check if reading contains ascii (romaji-ish)
            if any(ord(c) < 128 for c in v.reading):
                new_reading = to_kana(v.reading)
                if new_reading != v.reading:
                    self.stdout.write(f'Converting {v.word}: {v.reading} -> {new_reading}')
                    v.reading = new_reading
                    v.save()
                    count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully converted {count} vocab readings.'))
