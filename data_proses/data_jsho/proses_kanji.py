import json
import re

# Daftar Pasti 103 Kanji N5
N5_KANJI = set(
    "一二三四五六七八九十百千万円日月火水木金土本休語年午前後半毎何行来帰食飲見聞読書"
    "話買教朝昼夜晩夕方春夏秋冬東西南北上下左右中内外白黒赤青男女父母子友人名手足目耳口"
    "先生学校高安大小新古長多少早"
)

# Daftar Pasti 181 Kanji N4
N4_KANJI = set(
    "会同事自社発者地業方場員組立開力問代明動京通言理体田作用強公野思家正心交答考引知"
    "歩走止送洗売貸借終切建急待持落留字音暗遠近弱軽重太細悪医意院運影泳英駅園歌画回海"
    "界皆絵階害街各覚楽活寒漢間気記起期客牛去魚局銀句区苦具空兄係血決県験元工広光号合"
    "国困婚査算賛残仕使司史市糸紙寺室借首主習週集住宿術初所暑商笑乗城色信神親身進図声"
    "星晴雪船線全素対待台第題達単短知池置遅茶着町鳥弟店点電刀島当頭同道特肉馬麦番病風"
    "別勉便妹味民無鳴毛門問薬洋理里旅両料林注曜"
)

kanji_list = []

print("Mulai memproses database...")

# Baca file kanjidic (EUC-JP)
with open('kanjidic', 'r', encoding='euc-jp', errors='ignore') as f:
    for line in f:
        # Abaikan baris kosong atau komentar
        if line.startswith('#') or not line.strip():
            continue
            
        tokens = line.split()
        if not tokens:
            continue
            
        kanji_char = tokens[0]
        
        # 1. CEK VIP: Apakah ini Kanji N5 atau N4?
        if kanji_char in N5_KANJI:
            level = "N5"
        elif kanji_char in N4_KANJI:
            level = "N4"
        else:
            continue # Langsung buang kalau bukan N5/N4!
            
        # 2. Ambil Jumlah Guratan (Strokes)
        stroke_match = [p for p in tokens if p.startswith('S') and p[1:].isdigit()]
        strokes = int(stroke_match[0][1:]) if stroke_match else 0
        
        # 3. Ambil Arti Bahasa Inggris (Meaning)
        # Cari semua teks dalam { }
        meanings = [re.sub(r'[{}]', '', m) for m in re.findall(r'\{.*?\}', line)]
        
        # 4. Filter Onyomi & Kunyomi Bersih
        onyomi = []
        kunyomi = []
        
        for tok in tokens[1:]:
            # Stop pencarian kalau sudah masuk ke area makna atau nanori (nama orang)
            if tok.startswith('{') or tok.startswith('T1'):
                break
                
            # Abaikan kode referensi mesin (pasti diawali huruf kapital/angka)
            if tok and (tok[0].isupper() or tok[0].isdigit()):
                continue
                
            # Pisahkan Kana
            if any('\u30a0' <= c <= '\u30ff' for c in tok): # Katakana
                onyomi.append(tok)
            elif any('\u3040' <= c <= '\u309f' for c in tok): # Hiragana
                kunyomi.append(tok)
                
        # Gabungkan data
        kanji_list.append({
            "kanji": kanji_char,
            "level": level,
            "strokes": strokes,
            "onyomi": onyomi,
            "kunyomi": kunyomi,
            "meaning_en": meanings,
            "meaning_id": ""
        })

# Simpan hasilnya
with open('kanjidic_n5_n4.json', 'w', encoding='utf-8') as out_f:
    json.dump(kanji_list, out_f, ensure_ascii=False, indent=4)

print(f"Beres, jir! 🎉 Berhasil mengekstrak {len(kanji_list)} Kanji (N5 & N4) dengan sempurna.")
print("Cek file 'kanjidic_n5_n4.json'!")
