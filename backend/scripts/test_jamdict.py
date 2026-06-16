from jamdict import Jamdict
jmd = Jamdict()
result = jmd.lookup('食べる')
for entry in result.entries:
    print(f"Word: {entry.kanji_forms[0] if entry.kanji_forms else entry.kana_forms[0]}")
    for sense in entry.senses:
        print(f"POS: {sense.pos}")
        print(f"Gloss: {sense.text()}")
