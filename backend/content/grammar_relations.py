from django.db.models import prefetch_related_objects


def serialize_grammar(grammar):
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
        sentences = legacy_sentences

    return {
        'id': grammar.id,
        'title': grammar.title,
        'structure': grammar.structure,
        'explanation': grammar.explanation,
        'chapter': grammar.chapter,
        'jlpt_level': grammar.jlpt_level,
        'sentences': sentences,
    }


def serialize_grammars(grammars):
    grammars = list(grammars)
    prefetch_related_objects(grammars, 'sentence_records__expressions')
    return [serialize_grammar(grammar) for grammar in grammars]