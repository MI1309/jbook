from django.db.models import prefetch_related_objects
import re
from urllib.parse import quote


_KANA_ROMAJI = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
    'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'っ': '', 'ー': '',
}
_KANA_DIGRAPHS = {
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo', 'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho', 'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo', 'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo', 'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo', 'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
}


def generate_bunpo_slug(title):
    normalized = str(title or '').strip().lower()
    if not normalized:
        return None
    normalized = re.sub(r'[～〜~]', ' ', normalized).strip()
    normalized = re.sub(r'[^\w\s-]', '', normalized, flags=re.UNICODE)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    if re.search(r'[一-龯々〆ヵヶ]', normalized):
        return quote(normalized, safe='-')

    normalized = ''.join(
        chr(ord(character) - 0x60) if '\u30a1' <= character <= '\u30f6' else character
        for character in normalized
    )
    if normalized == 'は':
        normalized = 'わ'
    else:
        normalized = re.sub(r'は(?=[\s]|$)', 'わ', normalized)
    result = []
    index = 0
    while index < len(normalized):
        pair = normalized[index:index + 2]
        if pair in _KANA_DIGRAPHS:
            result.append(_KANA_DIGRAPHS[pair])
            index += 2
            continue
        character = normalized[index]
        if character == 'っ' and index + 1 < len(normalized):
            next_pair = normalized[index + 1:index + 3]
            next_romaji = _KANA_DIGRAPHS.get(next_pair, _KANA_ROMAJI.get(normalized[index + 1], ''))
            if next_romaji:
                result.append(next_romaji[0])
        else:
            result.append(_KANA_ROMAJI.get(character, character))
        index += 1

    slug = ''.join(result)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return re.sub(r'^-+|-+$', '', slug) or quote(normalized, safe='-')


def serialize_grammar(grammar, include_source_data=False):
    prefetch_related_objects([grammar], 'sentence_records__expressions')
    legacy_sentences = grammar.sentences if isinstance(grammar.sentences, list) else []
    sentence_rows = list(grammar.sentence_records.all())
    sentences = []

    if sentence_rows:
        for row in sentence_rows:
            sentence = dict(legacy_sentences[row.order]) if row.order < len(legacy_sentences) and isinstance(legacy_sentences[row.order], dict) else {}
            expressions = [
                {
                    'id': str(expression.id),
                    'word': expression.word,
                    'reading': expression.reading,
                    'meaning': expression.meaning,
                    'word_type': expression.word_type,
                }
                for expression in row.expressions.all()
            ]
            sentence.update({
                'jp': row.jp,
                'id': row.translation,
                'expression_ids': [expression['id'] for expression in expressions],
                'expressions': expressions,
            })
            sentences.append(sentence)
    else:
        sentences = [dict(sentence) for sentence in legacy_sentences if isinstance(sentence, dict)]

    sections = dict(grammar.sections) if isinstance(grammar.sections, dict) else None
    if sections is not None:
        sections.pop('miniPractice', None)
    tags = grammar.tags if isinstance(grammar.tags, list) else []

    serialized = {
        'id': grammar.id,
        'title': grammar.title,
        'structure': grammar.structure,
        'explanation': grammar.explanation,
        'chapter': grammar.chapter,
        'jlpt_level': grammar.jlpt_level,
        'sentences': sentences,
        'slug': generate_bunpo_slug(grammar.title),
        'sections': sections,
        'tags': [tag for tag in tags if isinstance(tag, str)],
    }
    if include_source_data:
        serialized['source_data'] = grammar.source_data
    return serialized


def serialize_grammars(grammars):
    grammars = list(grammars)
    prefetch_related_objects(grammars, 'sentence_records__expressions')
    return [serialize_grammar(grammar) for grammar in grammars]