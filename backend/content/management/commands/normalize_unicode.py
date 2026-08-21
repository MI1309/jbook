import unicodedata
import pykakasi
from django.core.management.base import BaseCommand
from content.models import Vocab, Kanji

# Initialize pykakasi (no deep_translator needed here)
kakasi = pykakasi.kakasi()


def is_kanji(ch: str) -> bool:
    if not ch:
        return False
    ch_norm = unicodedata.normalize('NFKC', ch)
    return bool('\u4e00' <= ch_norm <= '\u9fff' or '\u3400' <= ch_norm <= '\u4dbf')


def generate_furigana_map(text: str) -> list:
    """
    Return a list of furigana segments aligned with each character in `text`.
    For non-kanji characters the segment will be an empty string.
    """
    if not text:
        return []

    text = unicodedata.normalize('NFKC', text)
    converted = kakasi.convert(text)
    fmap = ['' for _ in text]

    pos = 0
    for seg in converted:
        orig = seg.get('orig', '')
        hira = seg.get('hira', '')
        L = len(orig)
        if L == 0:
            continue

        kanji_indices = [i for i, c in enumerate(orig) if is_kanji(c)]
        kcount = len(kanji_indices)

        if kcount == 0:
            pos += L
            continue

        # Strip common prefix/suffix kana between orig and hira (okurigana)
        prefix_len = 0
        while (prefix_len < len(orig) and prefix_len < len(hira)
               and orig[prefix_len] == hira[prefix_len]
               and not is_kanji(orig[prefix_len])):
            prefix_len += 1

        suffix_len = 0
        while (suffix_len < (len(orig) - prefix_len)
               and suffix_len < (len(hira) - prefix_len)
               and orig[len(orig) - 1 - suffix_len] == hira[len(hira) - 1 - suffix_len]
               and not is_kanji(orig[len(orig) - 1 - suffix_len])):
            suffix_len += 1

        core_hira = hira[prefix_len: len(hira) - suffix_len] if suffix_len else hira[prefix_len:]

        if kcount == 1:
            idx = kanji_indices[0]
            if 0 <= pos + idx < len(fmap):
                fmap[pos + idx] = core_hira
        else:
            total = len(core_hira)
            base = total // kcount if kcount else 0
            rem = total - base * kcount
            p = 0
            for idx in kanji_indices:
                take = base + (1 if rem > 0 else 0)
                if rem > 0:
                    rem -= 1
                part = core_hira[p:p + take]
                if 0 <= pos + idx < len(fmap):
                    fmap[pos + idx] = part
                p += take

        pos += L

    return fmap


class Command(BaseCommand):
    help = 'Normalize all Vocab and Kanji unicode characters (NFKC) and update furigana map'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update all furigana_map even if already set',
        )
        parser.add_argument(
            '--test',
            type=str,
            help='Test generate_furigana_map for a specific word and print result',
        )

    def handle(self, *args, **options):
        # Debug mode: test a single word
        if options.get('test'):
            word = options['test']
            result = generate_furigana_map(word)
            self.stdout.write(f"Word: {word!r}")
            self.stdout.write(f"furigana_map: {result}")
            return

        force = options.get('force', False)

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
            if force or v.furigana_map != new_fmap:
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
