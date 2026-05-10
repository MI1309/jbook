from django.core.management.base import BaseCommand
from content.models import Vocab
from collections import defaultdict

class Command(BaseCommand):
    help = 'Cleans up duplicate N4 Kotoba entries based on the word field.'

    def handle(self, *args, **options):
        n4_vocab = Vocab.objects.filter(jlpt_level=4)
        
        # Group by word
        duplicates = defaultdict(list)
        for v in n4_vocab:
            duplicates[v.word.strip()].append(v)
            
        deleted_count = 0
        
        for word, instances in duplicates.items():
            if len(instances) > 1:
                # Keep the first one, delete the rest
                keep = instances[0]
                to_delete = instances[1:]
                
                self.stdout.write(f"Found {len(instances)} instances of '{word}'. Keeping ID {keep.id}, deleting others.")
                
                for d in to_delete:
                    # Optionally print what meaning is being deleted
                    self.stdout.write(f"  - Deleting: '{d.word}' (Meaning: {d.meaning})")
                    d.delete()
                    deleted_count += 1
                    
        self.stdout.write(self.style.SUCCESS(f'Successfully deleted {deleted_count} duplicate N4 kotoba entries.'))
