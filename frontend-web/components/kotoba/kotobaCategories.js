export const KOTOBA_CATEGORIES = [
    { slug: 'noun', wordType: 'noun', name: 'Kata Benda', japanese: '名詞', description: 'Nama orang, tempat, benda, dan berbagai hal di sekitar kita.', icon: 'Box' },
    { slug: 'godan', wordType: 'godan', name: 'Kata Kerja Godan', japanese: '五段動詞', description: 'Kata kerja golongan pertama dengan perubahan bunyi pada akhir kata.', icon: 'Footprints' },
    { slug: 'ichidan', wordType: 'ichidan', name: 'Kata Kerja Ichidan', japanese: '一段動詞', description: 'Kata kerja golongan kedua yang umumnya berakhiran いる atau える.', icon: 'Footprints' },
    { slug: 'suru', wordType: 'suru', name: 'Kata Kerja Suru', japanese: 'する動詞', description: 'Kata kerja yang dibentuk dari kata benda ditambah する.', icon: 'Footprints' },
    { slug: 'intransitive', wordType: 'intransitive', name: 'Kata Kerja Intransitif', japanese: '自動詞', description: 'Kata kerja yang menyatakan perubahan atau tindakan tanpa objek langsung.', icon: 'MoveRight' },
    { slug: 'transitive', wordType: 'transitive', name: 'Kata Kerja Transitif', japanese: '他動詞', description: 'Kata kerja yang tindakannya diarahkan pada objek.', icon: 'MoveLeft' },
    { slug: 'i-adjective', wordType: 'i_adj', name: 'Kata Sifat I', japanese: 'い形容詞', description: 'Kata sifat berakhiran い yang dapat menerangkan benda atau keadaan.', icon: 'Sparkles' },
    { slug: 'na-adjective', wordType: 'na_adj', name: 'Kata Sifat Na', japanese: 'な形容詞', description: 'Kata sifat yang menggunakan な saat menerangkan kata benda.', icon: 'Sparkles' },
    { slug: 'adverb', wordType: 'adverb', name: 'Kata Keterangan', japanese: '副詞', description: 'Kata yang memberi keterangan tentang tindakan, sifat, atau keadaan.', icon: 'Gauge' },
    { slug: 'particle', wordType: 'particle', name: 'Partikel', japanese: '助詞', description: 'Penanda hubungan antarkata dan fungsi kata di dalam kalimat.', icon: 'Link2' },
    { slug: 'suffix', wordType: 'suffix', name: 'Akhiran', japanese: '接尾辞', description: 'Unsur yang ditambahkan di akhir kata untuk membentuk makna tertentu.', icon: 'BetweenHorizontalEnd' },
    { slug: 'conjunction', wordType: 'conjunction', name: 'Kata Sambung', japanese: '接続詞', description: 'Penghubung kata, frasa, atau kalimat dalam percakapan dan tulisan.', icon: 'GitBranch' },
    { slug: 'expression', wordType: 'expression', name: 'Ekspresi', japanese: '表現', description: 'Ungkapan praktis yang digunakan dalam situasi sehari-hari.', icon: 'MessageCircle' },
    { slug: 'interjection', wordType: 'interjection', name: 'Kata Seru', japanese: '感動詞', description: 'Seruan singkat untuk menyatakan reaksi atau emosi.', icon: 'Volume2' },
    { slug: 'pronoun', wordType: 'pronoun', name: 'Kata Ganti', japanese: '代名詞', description: 'Kata untuk merujuk orang, benda, atau hal tanpa menyebut namanya.', icon: 'UserRound' },
    { slug: 'counter', wordType: 'counter', name: 'Kata Bantu Bilangan', japanese: '助数詞', description: 'Kata penghitung yang dipasangkan dengan angka sesuai jenis benda.', icon: 'Hash' },
    { slug: 'other', wordType: 'other', name: 'Lain-lain', japanese: 'その他', description: 'Kosakata dengan tipe lain yang belum masuk kategori khusus.', icon: 'Shapes' },
];

export const getKotobaCategory = (slug) => KOTOBA_CATEGORIES.find((category) => category.slug === slug);

export const getKotobaCategoryByType = (wordType) => KOTOBA_CATEGORIES.find((category) => category.wordType === wordType);