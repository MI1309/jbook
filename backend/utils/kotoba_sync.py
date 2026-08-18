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
