import json
import logging
import uuid
from typing import List, Dict, Any
import pykakasi
from deep_translator import GoogleTranslator

logger = logging.getLogger(__name__)

# Initialize pykakasi
kakasi = pykakasi.kakasi()

def generate_furigana(text: str) -> str:
    """
    Generate furigana from Japanese text.
    Returns Hiragana if the input contains Kanji.
    If no Kanji, returns the original text.
    """
    if not text:
        return ""
    result = kakasi.convert(text)
    # Reconstruct the string using hira (hiragana)
    furigana = "".join([item['hira'] for item in result])
    return furigana


def is_kanji(ch: str) -> bool:
    # Unicode range for common CJK Unified Ideographs
    return bool(ch and ('\u4e00' <= ch <= '\u9fff' or '\u3400' <= ch <= '\u4dbf'))


def generate_furigana_map(text: str) -> List[str]:
    """
    Return a list of furigana segments aligned with each character in `text`.
    For non-kanji characters the segment will be an empty string.
    Uses pykakasi.convert as a best-effort to split readings per-character.
    """
    if not text:
        return []

    converted = kakasi.convert(text)
    # Initialize empty map
    fmap: List[str] = ['' for _ in text]

    # Iterate through converted segments and assign readings to Kanji characters
    pos = 0
    for seg in converted:
        orig = seg.get('orig', '')
        hira = seg.get('hira', '')
        L = len(orig)
        if L == 0:
            continue

        # Count kanji chars in this orig segment
        kanji_chars = [c for c in orig if is_kanji(c)]
        kcount = len(kanji_chars)

        if kcount == 0:
            # advance pos by orig length
            pos += L
            continue

        # If there's only one kanji in the segment, give it the whole hira
        if kcount == 1:
            # find index of the kanji within orig
            idx_in_orig = None
            for i, c in enumerate(orig):
                if is_kanji(c):
                    idx_in_orig = i
                    break
            if idx_in_orig is not None:
                # global index
                global_idx = pos + idx_in_orig
                if 0 <= global_idx < len(fmap):
                    fmap[global_idx] = hira
        else:
            # Multiple kanji in the segment: split hira into kcount parts roughly equally
            # distribute remainder to the earlier parts
            total = len(hira)
            base = total // kcount if kcount else 0
            rem = total - base * kcount
            p = 0
            # iterate orig positions and assign to each kanji encountered
            for i, c in enumerate(orig):
                if is_kanji(c):
                    take = base + (1 if rem > 0 else 0)
                    if rem > 0:
                        rem -= 1
                    part = hira[p:p+take]
                    global_idx = pos + i
                    if 0 <= global_idx < len(fmap):
                        fmap[global_idx] = part
                    p += take

        pos += L

    return fmap

def translate_ja_to_id(text: str) -> str:
    """
    Translate Japanese text to Indonesian using deep-translator (Google Translate).
    """
    if not text:
        return ""
    try:
        translator = GoogleTranslator(source='ja', target='id')
        return translator.translate(text)
    except Exception as e:
        logger.error(f"Translation failed for '{text}': {str(e)}")
        return ""

def process_new_kotoba(word_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes incomplete kotoba data and fills in the blanks (translation, furigana).
    """
    word = word_data.get('word', '')
    reading = word_data.get('reading', '')
    furigana = word_data.get('furigana', '')
    meaning = word_data.get('meaning', '')

    # If no furigana but we have a word, generate it
    if not furigana and word:
        furigana = generate_furigana(word)
        word_data['furigana'] = furigana
        
    # If no reading but we have furigana, we could optionally convert furigana to romaji
    # but the current schema uses kana for reading in frontend anyway.
    if not reading and furigana:
        # Convert furigana to romaji
        romaji_result = kakasi.convert(furigana)
        word_data['reading'] = "".join([item['hepburn'] for item in romaji_result])

    # If no meaning, auto-translate
    if not meaning and word:
        word_data['meaning'] = translate_ja_to_id(word)
        
    # If there are examples without meaning, translate them too
    examples = word_data.get('examples', [])
    for ex in examples:
        if 'sentence' in ex and not ex.get('meaning'):
            ex['meaning'] = translate_ja_to_id(ex['sentence'])
    
    # Build furigana map per character for better frontend rendering
    if word:
        try:
            fmap = generate_furigana_map(word)
            if fmap:
                word_data['furigana_map'] = fmap
        except Exception:
            # don't fail on mapping errors
            pass
            
    return word_data

def sync_kotoba_data(local_data: List[Dict[str, Any]], skip_existing: bool = False) -> Dict[str, Any]:
    """
    Sync a list of dictionary data to the database.
    This function should be called within a Django context.
    """
    from content.models import Vocab
    
    stats = {
        "added": 0,
        "updated": 0,
        "skipped": 0,
        "errors": 0
    }
    
    for item in local_data:
        try:
            # Process auto-translate and furigana if needed
            item = process_new_kotoba(item)
            
            # Check by ID if provided, otherwise by Word
            vocab_id = item.get('id')
            # Validate provided id: if it's not a valid UUID, ignore it
            if vocab_id:
                try:
                    # sanitize common smart quotes and whitespace
                    if isinstance(vocab_id, str):
                        vocab_id = vocab_id.strip().strip('“”"')
                    uuid_obj = uuid.UUID(str(vocab_id))
                    vocab_id = str(uuid_obj)
                except Exception:
                    logger.warning(f"Invalid UUID provided for word {item.get('word', '')}: {vocab_id}. Ignoring provided id.")
                    vocab_id = None
                    item.pop('id', None)
            word = item.get('word')
            
            if not word:
                stats["errors"] += 1
                continue
                
            defaults = {
                'reading': item.get('reading', ''),
                'furigana': item.get('furigana', ''),
                'furigana_map': item.get('furigana_map', []),
                'meaning': item.get('meaning', ''),
                'word_type': item.get('word_type', ''),
                'jlpt_level': item.get('jlpt_level', 5),
                'examples': item.get('examples', [])
            }
            
            # Remove None values from defaults
            defaults = {k: v for k, v in defaults.items() if v is not None}
            
            vocab = None
            created = False
            
            if vocab_id:
                # Try to find by ID
                vocab = Vocab.objects.filter(id=vocab_id).first()
                if vocab:
                    if skip_existing and vocab.word == word:
                        stats['skipped'] += 1
                    else:
                        # Update
                        for k, v in defaults.items():
                            setattr(vocab, k, v)
                        if word:
                            vocab.word = word
                        vocab.save()
                        stats["updated"] += 1
                else:
                    if skip_existing and Vocab.objects.filter(word=word).exists():
                        stats['skipped'] += 1
                    else:
                        # Create with ID
                        vocab = Vocab.objects.create(id=vocab_id, word=word, **defaults)
                        stats["added"] += 1
            else:
                if skip_existing and Vocab.objects.filter(word=word).exists():
                    stats['skipped'] += 1
                else:
                    # Ensure we don't create duplicates: find all with same word
                    qs = Vocab.objects.filter(word=word)
                    if qs.exists():
                        # If multiple entries exist, keep the first and remove the rest
                        if qs.count() > 1:
                            first = qs.first()
                            others = qs.exclude(id=first.id)
                            others.delete()
                            vocab = first
                        else:
                            vocab = qs.first()

                        # Overwrite fields with provided/default values
                        for k, v in defaults.items():
                            setattr(vocab, k, v)
                        if word:
                            vocab.word = word
                        vocab.save()
                        stats["updated"] += 1
                    else:
                        # Create new entry
                        vocab = Vocab.objects.create(word=word, **defaults)
                        stats["added"] += 1
                    
        except Exception as e:
            logger.error(f"Error syncing item {item.get('word', 'Unknown')}: {str(e)}")
            stats["errors"] += 1
            
    return stats

def sync_from_json_file(file_path: str, skip_existing: bool = False) -> Dict[str, Any]:
    """
    Read from a local JSON file and sync to database.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if not isinstance(data, list):
            # Try to handle if it's a single object
            if isinstance(data, dict):
                data = [data]
            else:
                return {"error": "Format JSON tidak valid. Harus berupa array/list of objects."}
                
        return sync_kotoba_data(data, skip_existing=skip_existing)
    except FileNotFoundError:
        return {"error": f"File {file_path} tidak ditemukan."}
    except json.JSONDecodeError:
        return {"error": f"File {file_path} bukan JSON yang valid."}
    except Exception as e:
        return {"error": str(e)}
